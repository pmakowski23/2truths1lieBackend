# Live on

https://two-truths-one-lie.herokuapp.com/

# BACKEND for 2Truths1Lie Game

- node.js with sockets.io
- all in memory db as informations don't have to be stored over time for now.

## TODO

- add mongoDB to store players data
- Zapisywać stan gier między graczami (w zależności od ułożenia)
  - np. jak gra jan patryk to score jest 1:0
    jak gra jan z maliną to jest 0:1
- Wyświetlać przy scorze
  - Jeśli nie jest kłamcą -> Prawidłową odpowiedź
  - Jeśli jest kłamcą -> Które osoby jaką odpowiedź zaznaczyły
- Jeśli lobbyData === undefined to wyjebać patryka rozgwiazdę albo jakiś problem
- Add lobby searching
