pragma solidity ^0.5.0;

contract TicTacToe {
    uint constant public gameCost = 0.1 ether;
    
    uint8 public boardSize = 3;
    uint8 public movesCounter;
    
    bool gameActive;
    
    address[3][3] board;
    
    address payable public player1;
    address payable public player2;
    
    uint balanceToWithDrawPlayer1;
    uint balanceToWithDrawPlayer2;
    
    uint timeToReact = 3 minutes;
    uint gameValidUntil;
    
    address payable public activePlayer;
    
    event PlayerJoined(address player);
    event NextPlayer(address player);
    event GameOverWithWin(address winner);
    event GameOverWithDraw();
    event PayoutSuccess(address receiver, uint amountInWei);
    
    constructor() public payable {
        player1 = msg.sender;
        require(msg.value == gameCost);
        gameValidUntil = now + timeToReact;
    }
    
    function joinGame() public payable {
        assert(player2 == address(0));
        gameActive = true;
        
        require(msg.value == gameCost);
        
        player2 = msg.sender;
        emit PlayerJoined(player2);
        if (block.number % 2 == 0) {
            activePlayer = player2;
        } else {
            activePlayer = player1;
        }
        
        gameValidUntil = now + timeToReact;
        
        emit NextPlayer(activePlayer);
    }
    
    function getBoard() public view returns(address[3][3] memory) {
        return board;
    }
    
    function setWinner(address payable player) private {
        gameActive = false;
        // emit an event
        emit GameOverWithWin(player);
        uint balanceToPayOut = address(this).balance;
        if (player.send(balanceToPayOut) != true) {
            if (player == player1) {
                balanceToWithDrawPlayer1 = balanceToPayOut;
            } else {
                balanceToWithDrawPlayer2 = balanceToPayOut;
            }
        } else {
            emit PayoutSuccess(player, balanceToPayOut);
        }
        // transfer money to the winner
    }
    
    function withdrawWin() public {
        if (msg.sender == player1) {
            require(balanceToWithDrawPlayer1 > 0);
            balanceToWithDrawPlayer1 = 0;
            player1.transfer(balanceToWithDrawPlayer1);
            emit PayoutSuccess(player1, balanceToWithDrawPlayer1);
        } else {
            require(balanceToWithDrawPlayer2 > 0);
            balanceToWithDrawPlayer2 = 0;
            player2.transfer(balanceToWithDrawPlayer2);
            emit PayoutSuccess(player2, balanceToWithDrawPlayer2);
        }
    }
    
    function setDraw() private {
        gameActive = false;
        emit GameOverWithDraw();
        
        uint balanceToPayOut = address(this).balance/2;
        
        if (player1.send(balanceToPayOut) == false) {
            balanceToWithDrawPlayer1 += balanceToPayOut;
        } else {
            emit PayoutSuccess(player1, balanceToPayOut);
        }
        if (player2.send(balanceToPayOut) == false) {
            balanceToWithDrawPlayer2 += balanceToPayOut;
        } else {
            emit PayoutSuccess(player2, balanceToPayOut);
        }
    }
    
    function emergencyCashout() public {
        require(gameValidUntil < now);
        require(gameActive);
        setDraw();
    }
    
    function setStone(uint8 x, uint8 y) public {
        require(board[x][y] == address(0));
        require(gameValidUntil > now);
        assert(gameActive);
        assert(x < boardSize);
        assert(y < boardSize);
        require(msg.sender == activePlayer);
        board[x][y] = msg.sender;
        movesCounter++;
        gameValidUntil = now + timeToReact;
        
        for(uint8 i = 0; i < boardSize; i++) {
            if (board[i][y] != activePlayer) {
                break;
            }
            //win
            if (i == boardSize - 1) {
                //winner
                setWinner(activePlayer);
                return;
            }
        }
        for(uint8 i = 0; i < boardSize; i++) {
            if (board[x][i] != activePlayer) {
                break;
            }
            //win
            if (i == boardSize - 1) {
                //winner
                setWinner(activePlayer);
                return;
            }
        }
        // diagonale
        if (x==y) {
            for (uint i = 0; i < boardSize; i++) {
                if (board[i][i] != activePlayer) {
                    break;
                }
                //win
                if (i == boardSize - 1) {
                    //winner
                    setWinner(activePlayer);
                    return;
                }
            }
        }
        // anti-diagonale
        if ((x+y) == boardSize-1) {
            for (uint i = 0; i < boardSize; i++) {
                if (board[i][(boardSize-1)-i] != activePlayer) {
                    break;
                }
                //win
                if (i == boardSize - 1) {
                    //winner
                    setWinner(activePlayer);
                    return;
                }
            }
        }
        
        // draw
        if (movesCounter == (boardSize**2)) {
            //draw
            setDraw();
            return;
        }
        
        if (activePlayer == player1) {
            activePlayer = player2;
        } else {
            activePlayer = player1;
        }
		emit NextPlayer(activePlayer);
    }
}

