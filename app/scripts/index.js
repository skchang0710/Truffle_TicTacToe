import '../styles/app.css'
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'
import tictactoeArtifact from '../../build/contracts/TicTacToe.json'

const TicTacToe = contract(tictactoeArtifact)

let accounts
let account
let ticTacToe;

window.App = {
  start: function () {
    const self = this
    TicTacToe.setProvider(web3.currentProvider)

		//
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
  },
	useAccountOne: function() {
		account = accounts[1];
	},
	createNewGame: function() {
		console.log('Create Game Called, address :', account);
		TicTacToe.new({
			from: account,
			value: web3.utils.toWei('0.1', 'ether'),
			gas: 3000000

		}).then(instance => {
			ticTacToe = instance;
			console.log(ticTacToe);

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
				return ticTacToe.joinGame({
					from: account,
					value: web3.utils.toWei('0.1', 'ether'),
					gas: 3000000
				});
			}).then(txResult => {
				console.log(txResult);

			}).catch(error => {
				console.log(error);
			});
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
