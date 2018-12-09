var TicTacToe = artifacts.require("TicTacToe");

contract("TicTacToe", function(accounts) {
	it("should be possible to win", function() {
		let ticTacToe;
		let playerOne = accounts[0];
		let playerTwo = accounts[1];
		let wager = web3.utils.toWei('0.1', 'ether');
		
		return TicTacToe.new({
			from: playerOne,
			value: wager

		}).then(instance => {
			ticTacToe = instance;
			return ticTacToe.joinGame({from: playerTwo, value: wager});

		}).then(txResult => {
			console.log('');
			console.log('< join game logs args >');
			console.log('');
			console.log(txResult.logs[1].args);
			console.log('');
			console.log('< start game >');
			console.log('');
			return ticTacToe.setStone(0, 0, {from: txResult.logs[1].args.player});

		}).then(txResult => {
			return ticTacToe.setStone(0, 1, {from: txResult.logs[0].args.player});

		}).then(txResult => {
			return ticTacToe.setStone(1, 0, {from: txResult.logs[0].args.player});

		}).then(txResult => {
			return ticTacToe.setStone(1, 1, {from: txResult.logs[0].args.player});

		}).then(txResult => {
			return ticTacToe.setStone(2, 0, {from: txResult.logs[0].args.player});

		}).then(txResult => {
			console.log(txResult);
			let event = txResult.logs[0].event;
			let assertValue = 'GameOverWithWin';
			let assertErrMsg = 'One of the players must have won the game';
			assert.equal(event, assertValue, assertErrMsg);
			let eventPayout = txResult.logs[1].event;
			assert.equal(eventPayout, 'PayoutSuccess');

		}).catch(err => {
			console.log(err);
		});
	});
});

