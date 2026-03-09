---
title: 'Scout Card Playing AI'
description: 'Fun with an AI playing Scout'
pubDate: 'Mar 8 2026'
heroImage: '../../assets/scout.png'
---

On a recent hut trip in BC, our crew spent some time playing
[***Scout***](https://oinkgames.com/en/games/analog/scout/), a card
game (Disclaimer, I am not associated with the inventor or seller at all, but
I suggest you go and buy the game :-).
One person won fairly consistently, but I could not figure out why;
for various reasons, it was not obvious to me what a better strategy would look
like. On the long drive back, I decided to train
an AI that ideally would exceed human players in skill so I could then inspect
what its strategy was. My initial idea was roughly to "*Throw all the game state
at a Transformer; let several of them compete against each other, and improve
them with Reinforcement Learning*". That project turned out to be a fun but deep
rabbit hole.
If you don't want to read about that and just play against my AI player, head
over to https://scout-app-kappa.vercel.app/ - NB I only optimized the
neural net player for the 5-player game.

## The Game
A brief intro: In Scout, a deck of cards (1-10s) is dealt to 3-5
players; they then proceed round-robin, either playing melds (sets/groups: e.g. "1,1,1",
or runs - e.g. "7,6,5,4") from
their hand to beat what's on the table, or *scouting* cards from the table
to build a better hand. The game ends when a player has played all their cards
or when there has been nothing but *Scouts* for a round. As the game progresses,
reward and penalty scores are gathered - how many cards on the table
were replaced, +1 if another player scouted one of our cards, and how many cards
are left in our hand when the game ends. The person with the highest score at
the end wins.

There's a bit more to the game I didn't get into (the order of cards cannot be
changed; Scout & Show moves; card flipping on Scouts; cycling through dealer),
but this should be enough context for the rest of the post.
A key challenge for me is that the winning strategy is not obvious, which I
suspect comes in large part from the scoring system that rewards and punishes a
variety of events instead of a single objective such as "be the first to dump
all cards" or "build the best meld". I also suspect the optimal strategy varies
depending on who you play against, how far along the game is, and how
many opponents there are. 

## The Basic Scaffold
The first components I had to build before thinking about training were
1. A **game engine** that takes care of managing game state - dealing
cards, executing moves, tracking scores, deciding when the game
is over. This engine also computes the set of moves the current player can
perform according to the rules.
1. **Players** that take the subset of the game state visible to them, including
which moves they can take, and select one of these moves.
1. **Evaluation** methods - measuring how well players perform against each
other.

This turned out to be a lot of fun - I implemented a multi-player
offline version of Elo ([Plackett-Luce model](https://en.wikipedia.org/wiki/Bradley%E2%80%93Terry_model#Plackett%E2%80%93Luce_model)),
and the logic for efficiently identifying valid moves felt like working a fun
tech interview prooblem.


## The First Generation of AI Players
A player is implemented by a Python class with one key function `select_move`
which picks a move given the current game state visible to this player.

The first player I implemented, `RandomPlayer`, is just that - it samples
uniformly from the set of legal moves. While trivial, it allowed me to run
end-to-end tests of the whole system, and it provided a baseline for other
players to compete against (e.g., if another player couldn't consistently win
against this one, it hinted at bugs).

I then added a couple of other players with less-than-random move selection - I
call them "heuristic" players because they base their decision on hardcoded
heuristics about what constitutes a good move or hand.
The first one - `GreedyShowPlayer` - simply picks the move that dumps the most
cards from its hand. Not great, but better than `RandomPlayer`.

Another noteable once is `PlanningPlayer`:
for each possible move, it calculates its hand *after* the move; calculates a
heuristic value function of this hand (each **run** of *m* cards counts as 0.25*m;
each **group** of m cards (same face values) counts as 0.25*(m+0.5)); and adds
that to the number of points it gained or lost via the move.

`PlanningPlayer` turned out to be a surprisingly strong "baseline" (I found it
hard to win against it myself) which was instrumental for the next steps:
1. It allowed me to measure whether other players were actually doing well;
`PlanningPlayer` got assigned the *skill* **1.0**, and all other player's numerical
skills are relative to that baseline.
1. It allowed for generating fairly high-quality game traces, which can be useful
for eg imitation learning (initializing neural policies) or training value
functions of game states.

`PlanningPlayer` is rather crude in some ways:
1. It does a lot of double (or triple etc.) counting, e.g. every run of 3 is
also counted as two runs of two
1. It ignores face values (e.g. a group of 3 "1"s is assigned the same value as a group of 3
"10"s)
1. It does not employ any "think-ahead" strategies or speculation, such as
recognizing that a "1, 2, 4, 5" may be turned into a run-of-5 if we get to scout a 3,
or that a hand of "3, 1, 1, 3" becomes another group of 2 if we play "1, 1".

I tried to do some fine-tuning via grid-search, e.g. tuning the 0.25 coefficient,
using a polynomial value function, all with success; which was just as well
because I wanted to move on to learnt strategies anyway.

Another surprise at this point was that establishing a player's skill with a
somewhat reasonable confidence took a lot of games (and thus a lot of time).
Winning Scout is a combination of luck (the hands that are deal) and skill; and
the better players become / the closer in skill they are, the more games we need
to play to average out the noise and determine which one is better. I found that
playing on the order of 1,000 games was necessary to get a reliable estimate.


## The Second Generation - Monte-Carlo Tree Search
My original plan was to move on to training neural policies, but after consulting
with an LLM over possible algorithms to explore, I took a detour using 
[game trees](https://en.wikipedia.org/wiki/Game_tree).
The rough idea of game trees is that a player simulates a lot of games starting
from its current state, thus incrementally building a tree and developing an
idea of which moves lead to the best outcomes.
[Monte-Carlo tree search](https://en.wikipedia.org/wiki/Monte_Carlo_tree_search)
(MCTS) is a specific riff on that idea that balances exploration with
exploitation, assigning more weight to promising subtrees. The specific version
I used is called **Information Set Monte-Carlo Tree Search** - a modification of
MCTS that handles hidden state (what cards other players have - not a concern
in eg chess or Go) - and I sped it up by early stopping exploratory tree descents
with the use of a learnt neural value function.

This turned out to work OK. I could get high performing players
when investing a lot of computational resources - simulating on the order of
2,500 games per player per move to barely winning against `PlanningPlayer` - but
that takes a lot of time, and further investments led to diminishing returns.
I also learnt that ISMCTS did not work well here - the hidden state, and the
number of opponents, leads to such an extreme branching factor that building a
tree is effectively impossible, and ISMCTS degenerates into "flat Monte-Carlo".
I abandoned that approach after a lot of experiments, but it did give me the
first version of a neural value function, in particular a working featurizer.


## The Third Generation - Neural Policies

My next step was to train neural nets that would aid in move selection.
I considered to bootstrap such networks with imitation learning of `PlanningPlayer`
traces but decided to start with neural self-play from the get go (that is, let the
players compete against each other, and train them on that data), and revisit
imitation learning if necessary.

There were two architectural decisions to make early on:
1. What the inputs and outputs of the neural net should be
1. How to train the neural net

### Inputs & Outputs
One option for the neural net architecture would be a net that takes a game
state as input and outputs a move. But this would allow the net to generate
illegal moves, and it is unclear how to avoid that.
The second option was to feed a network the current game state, and a list of
embeddings (one for each move); then let the net score each move. My concern
about this approach was that the network would implicitly learn game dynamics
(how a move affects the game state - scores, hands, table) which we can easily
simulate. So I went with a third option: For each move, compute the post-move
state (hand, table, scores etc.) - then feed these N post move states to a
network and compute a probability distribution over moves.

### Training
As for how to train this network, the most obvious choice was a policy gradient
method, specifically, REINFORCE, due to its simplicity, and the reward it tries
to maximize is the difference between a player's score and the mean score at
the end of the game. This reward avoids reward hacking strategies such as 
players "helping each other out" (Scout is a non-zero sum game), but it retains
the important signal of "how good" a win was.

Instead of REINFORCE, I decided to give PPO a go, due to its popularity in
recent years in LLM post-training. I
also considered GRPO, a more modern variant that does away with the value
function network, but since that network is fairly small in my case and I'm
training several policy networks anyway, I wasn't worried about the overhead
and instead went with PPO.

Briefly, the pseudo-code for training is as follows:
```
players = init_players()
for i in 1:num_iterations:
    # Players play each other; trajectories record states, moves, scores
    trajectories = collect_episodes(players)
    for p in players:
        for e in 1:num_epochs:
            for b in batch(trajectories):
                # PPO training of policy network and value function
                train(p, b)
```

### Simple Feedforward Policy Network
At first, I trained simple feedforward neural nets, to make sure the code base
was functional and to again establish a baseline for future work.
I featurize the N post-move game states - histograms of what melds the player's
hand has, the score distribution, etc. - and feed the resulting Nx57 vector into
a linear feedforward MLP (128:64:1) with ReLUs to get a probability distribution
over N states.
One notable aspect of the architecture is that I knew this network is theoretically
capable to be at least as good as `PlanningPlayer`, because - given the features
it had access to - it could implement the very same heuristic function. If it
failed to do so, I knew it wasn't an architectural limitation, but a problem
with my learning process. 
After a bunch of hyperparameter explorations, I consistently trained nets that
won against `PlanningPlayer`, having a skill-level of roughly 1.5 relative to
`PlanningPlayer`'s 1.0. One of these networks powers the web app.

### Transformers - WIP
This is still work-in-prorgress. I tried for a while to use Transformers instead
of a fixed-length MLP, feeding raw card sequences to the Transformer. The hope
is that it learns to not only recognize melds, but also "almost-melds"
and other higher-level features I might not even think of; and avoid some of
the inductive bias that my MLP features undoubtedly have.
Unfortunately, I have so far not been able to match the `PlanningPlayer` performance.
I tried various network sizes and depths, number of players, explored different
input embeddings (the usual suspects - position and segment embeddings;
sinusoidal embeddings; linear projections into the embedding space), but I
seem to hit a ceiling at a skill level of roughly 0.3.

Experimenting further is somewhat hindered by the much higher computational
demands of Transformer training; while hyperparameter sweeps and model evaluation
is easy on my laptop for MLPs, I have to run Transformer training on a 
cloud GPU (T4) I paid for, and iterating feels very non-interactive.
I have plenty of ideas to try out on this front still, but given the strength
of the tiny MLP player, and the overhead for experimentation, I am not sure it's
worth it. My problem might be a trivial bug, or it might be that the Transformer
or PPO have a very hard time learning the concepts of groups and runs from
scratch.


## Web App
I also wrote a web-app that allows a human to play against `PlanningPlayer` and
the simple MLP player - you can find it at https://scout-app-kappa.vercel.app/.
The frontend is React, the backend is Flask, it's all written to run as a Vercel
Function (state being stored in Redis). Vercel has limitations on how many
dependencies one can bring in, and PyTorch easily exceeded that, so I ported the
trained MLP PyTorch model to numpy and use that for inference instead.


## Limitations and Conclusions
* I focused all my efforts on the 5-player scenario; 3- and 4-player
games seem to require rather different strategies, and at least initially I
wanted to keep that variable fixed. I do assume it may be best train a separate
neural net for different player numbers. At this point,
the web app does support 3- and 4-player games but the AI opponents likely
aren't at their best.
* One somewhat surprising insight for me was that the performance of a heuristic
player (`PlanningPlayer`) can be very good, and may be sufficient for use in eg
computer games. The heuristic I used is pretty simple (it took me less than an 
hour to implement and tune it), could easily be improved further, and probably
be fine-tuned with simply grid search instead of all the complexity that
reinforcement learning adds. They also are extremely fast at inference.
* I am convinced that a properly trained neural player will beat any heuristic
(and human) player, but it turned out to be quite a bit of work to get to that point
even with simple feedforward networks and AI coding assistants.  I have yet to
be successful with Transformers; and there is a vast range of ideas in the
"neural self play" domain (e.g. league style training, ensuring diversity etc.).
that I haven't explored yet in depth (see difficulties with experimentation).
On a scientific level, I feel this can be a considered a "solved problem" as
AlphaGo, AlphaStar, AlphaZero and MuZero have shown. On my hobby project here,
not yet :)
* I may wrap the project up here, or keep going with Transformers and 3/4 player
scenarios. In any case, the code is at my github repo, [scout-ai](https://github.com/myselph/scout-ai) for the 
engine and learning, [scout-app](https://github.com/myselph/scout-app) for the web app.
