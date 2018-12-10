import '../styles/app.css'
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'
import $ from 'jquery'
import tictactoeArtifact from '../../build/contracts/TicTacToe.json'

const TicTacToe = contract(tictactoeArtifact);
const Wager = Web3.utils.toWei('0.1', 'ether');

let accounts
let account
let ticTacToe;

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
			console.log('contract address :', ticTacToe.address);
			App.setOnClickHandler();

		}).catch(error => {
			console.log(error);
		});
	},
	joinGame: function() {
		console.log('Join Game Called :', account);
		let gameAddress = prompt('Address of the Game');
		if(gameAddress != null) {
			TicTacToe.at(gameAddress).then(instance => {
				ticTacToe = instance;
				return ticTacToe.joinGame({from: account,value: Wager,gas: 3000000});

			}).then(txResult => {
				console.log('Next Player :', txResult.logs[1].args.player);
				App.setOnClickHandler();

			}).catch(error => {
				console.log(error);
			});
		}
	},
	setStone: function(event) {
		console.log(event);
		ticTacToe.setStone(event.data.x, event.data.y, {from: account}).then(txResult => {
			console.log(txResult);
		});
	},
	setOnClickHandler: function() {
		for(var i = 0; i < 3; i++) {
			for(var j = 0; j < 3; j++) {
				$($('#board')[0].children[0].children[i].children[j]).off('click').click({x:i, y:j}, App.setStone);
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
