import '../styles/app.css'
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'
import $ from 'jquery'
import tictactoeArtifact from '../../build/contracts/TicTacToe.json'

const TicTacToe = contract(tictactoeArtifact);
const Wager = Web3.utils.toWei('0.1', 'ether');

let accounts;
let account;
let ticTacToe;

let nextPlayerEvent;
let gameOverWithWinEvent;
let gameOverWithDrawEvent;

window.App = {
	start: function () {
		const self = this
		TicTacToe.setProvider(web3.currentProvider)

		// truffle bug - https://github.com/trufflesuite/truffle-contract/issues/57
		if (typeof TicTacToe.currentProvider.sendAsync !== "function") {
			TicTacToe.currentProvider.sendAsync = function() {
				return TicTacToe.currentProvider.send.apply(
					TicTacToe.currentProvider, arguments
				);
			};
		}

		web3.eth.getAccounts(function (err, accs) {
			if (err != null) {
				alert('There was an error fetching your accounts.')
				return
			}
			if (accs.length === 0) {
				alert("Couldn't get any accounts!")
				return
			}
			console.log(accs);
			accounts = accs
			account = accounts[0]
		})

		// check web3 version
		let oldWeb3 = web3.version.api;
		let newWeb3 = web3.version;
		console.log('web3 version :', oldWeb3 ? oldWeb3 : newWeb3);
	},
	useAccountOne: function() {
		account = accounts[1];
		console.log('choose account :', account);
	},
	createNewGame: function() {
		console.log('Create Game Called, address :', account);
		TicTacToe.new({from: account, value: Wager, gas: 3000000}).then(instance => {
			ticTacToe = instance;

			$(".in-game").show();
			$(".waiting-for-join").hide();
			$(".game-start").hide();
			$("#game-address").text(ticTacToe.address);
			$("#waiting").show();

			let playerJoinedEvent = ticTacToe.PlayerJoined();
			playerJoinedEvent.watch((error, eventObj) => {
				$(".waiting-for-join").show();
				$("#opponent-address").text(eventObj.args.player);
				$("#your-turn").hide();
				// playerJoinedEvent.stopWatching();
				if (error) {
					console.log(error);
				} else {
					console.log(eventObj);
				}
			});

			App.listenToEvents();

		}).catch(error => {
			console.log(error);
		});
	},
	joinGame: async function() {
		try {
			console.log('Join Game Called :', account);
			let gameAddress = prompt('Address of the Game');
			if(gameAddress != null) {
				ticTacToe = await TicTacToe.at(gameAddress);
				App.listenToEvents();

				let txResult = await ticTacToe.joinGame({from: account,value: Wager,gas: 3000000});
				console.log(txResult);

				$(".in-game").show();
				$(".game-start").hide();
				$("#game-address").text(ticTacToe.address);
				$("#your-turn").hide();
				let player1Address = await ticTacToe.player1.call();
				$("#opponent-address").text(player1Address);
			}
		} catch (error) {
			console.log(error);
		}
	},
	listenToEvents: function() {
		nextPlayerEvent = ticTacToe.NextPlayer();
		nextPlayerEvent.watch(App.nextPlayer);

		gameOverWithWinEvent = ticTacToe.GameOverWithWin();
		gameOverWithWinEvent.watch(App.gameOver);

		gameOverWithDrawEvent = ticTacToe.GameOverWithDraw();
		gameOverWithDrawEvent.watch(App.gameOver);
	},
	nextPlayer: async function(error, eventObj) {
		console.log('Next Player :', eventObj);
		await App.printBoard();

		let player = web3.utils.toChecksumAddress(eventObj.args.player);
		if (player == account) {
			App.setOnClickHandler();
			$("#your-turn").show();
			$("#waiting").hide();
		} else {
			$("#your-turn").hide();
			$("#waiting").show();
		}
	},
	gameOver: function(error, eventObj) {
		console.log('Game Over', eventObj);
		if (eventObj.event == 'GameOverWithWin') {
		  let winner = web3.utils.toChecksumAddress(eventObj.args.winner);
			if (winner == account) {
				alert('Congratulations, You Won!');
			} else {
				alert('Woops, you lost! Try again...');
			}
		} else {
			alert("That's a draw !!");
		}

		//	try {
		//		nextPlayerEvent.stopWatching();
		//		gameOverWithWinEvent.stopWatching();
		//		gameOverWithDrawEvent.stopWatching();
		//	} catch (error) {
		//		console.log(error);
		//	}

		for(var i = 0; i < 3; i++) {
			for(var j = 0; j < 3; j++) {
				$('#board')[0].children[0].children[i].children[j].innerHTML = '';
			}
		}

		$(".in-game").hide();
		$(".waiting-for-join").hide();
		$(".game-start").show();
		$("#game-address").text('');
		$("#waiting").hide();
	},
	setStone: function(event) {
		console.log(`setStone : {${event.data.x}, ${event.data.y}}`);
		// todo: stone placeHolder 
		App.setOffClickHandler();

		ticTacToe.setStone(event.data.x, event.data.y, {from: account}).then(txResult => {
			console.log('txResult :', txResult);
			if (txResult.logs[0].event == 'NextPlayer') {
				console.log('Next Player :', txResult.logs[0].args.player);
			} else if (txResult.logs[0].event == 'GameOverWithWin') {
				console.log('Winner :', txResult.logs[0].args.winner);
				if (txResult.logs[1].event == 'PayoutSuccess') console.log('PayoutSuccess'); 
			}
			App.printBoard();
		}).catch(error => {
			console.log(error);
		});
	},
	setOnClickHandler: function() {
		for(var i = 0; i < 3; i++) {
			for(var j = 0; j < 3; j++) {
				if ($('#board')[0].children[0].children[i].children[j].innerHTML == '')
					$($('#board')[0].children[0].children[i].children[j]).off('click').click({x:i, y:j}, App.setStone);
			}
		}
	},
	setOffClickHandler: function() {
		for(var i = 0; i < 3; i++) {
			for(var j = 0; j < 3; j++) {
				$($('#board')[0].children[0].children[i].children[j]).prop('onclick', null).off('click');
			}
		}
	},
	printBoard: async function() {
		const board = await ticTacToe.getBoard.call();
		console.log(board);
		for(var i = 0; i < board.length; i++) {
			for(var j = 0; j < board[i].length; j++) {
				let id = web3.utils.toChecksumAddress(board[i][j]);
				let mark = (id == 0) ? '' : (id == account) ? 'X' : 'O';
				$('#board')[0].children[0].children[i].children[j].innerHTML = mark;
			}
		}
	}
};

window.addEventListener('load', function () {
  if (typeof web3 !== 'undefined') {
    console.warn('Using web3 detected from external source.')
    window.web3 = new Web3(web3.currentProvider)
  } else {
    console.warn('No web3 detected. Falling back to http://127.0.0.1:9545.')
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545'))
  }

  App.start()
})
