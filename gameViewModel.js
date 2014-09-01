createViewModel = function (d, $) {

	return {
		matrixSize: 0,

		possibleNumbers: [],

		lastPossibleNoIndex: 0,

		init: function (info) {
			var gameContainer = $("#gameContainer");

			this.matrixSize = info.matrixSize;
			this.possibleNumbers = info.possibleNumbers;

			this.initGameContainer(gameContainer);

			this.createTiles({ node: gameContainer, noOfTiles: this.matrixSize * this.matrixSize });

			this.attachArrowEvent(this.matrixSize);

			this.traverseNodes({ matrixSize: this.matrixSize });

			this.setInitialValues();
		},

		initGameContainer: function (gameContainer) {
			var gameContainerSide = this.matrixSize * 56;
			gameContainer[0].style.height = gameContainerSide;
			gameContainer[0].style.width = gameContainerSide;
		},

		reinitializeMatrix: function () {
			var matrixSizeInput = $("#matrixSizeInput")[0].value
				, possibleNumbersInput = $("#possibleNumbersInput")[0].value
			;
			
			if (!matrixSizeInput || !possibleNumbersInput) {
				console.log("Please give some input");
				return;
			}

			matrixSizeInput = parseInt(matrixSizeInput, 10);
			possibleNumbersInput = possibleNumbersInput.split(",").map( function (num) {
				return parseInt(num, 10);
			});

			this.reinitializeArrowClicks();

			$("#gameContainer > div").remove();

			this.init({ matrixSize: matrixSizeInput, possibleNumbers: possibleNumbersInput });
		},

		reinitializeArrowClicks: function () {
			var self = this;
			['onLeftArrowClick', 'onUpArrowClick', 'onRightArrowClick', 'onDownArrowClick'].forEach( function (clickEvent) {
				self[clickEvent].nodes = null;
			});
		},

		setInitialValues: function () {
			var self = this;	

			this.possibleNumbers.forEach( function () {
				self.generateNextPossibleNo();				
			});
		},

		traverseNodes: function (info) {
			var i = 0
				, allNodes = info.matrixSize * info.matrixSize
				, currentNode
				, prevLeftNode
				, nextRightNode
				, nextLeftNode
				, nextDownNode
				, nextUpNode
			;

			for (i = 0; i < allNodes; i++) {
				currentNode = $("#" + i)[0];
				nextDownNode = $("#" + (i + info.matrixSize))[0];
				nextUpNode = $("#" + (i - info.matrixSize))[0];

				if (prevLeftNode && i % info.matrixSize) 
					prevLeftNode.nextRightNode = currentNode;

				if (i % info.matrixSize)
					currentNode.nextLeftNode = prevLeftNode;

				currentNode.nextDownNode = nextDownNode;
				currentNode.nextUpNode = nextUpNode;

				prevLeftNode = currentNode;
			}

		},

		attachArrowEvent: function (matrixSize) {
			var self = this;

			$(d).keydown( function (e) {
				switch (e.which) {
					case 37: self.onLeftArrowClick({ e: e, matrixSize: matrixSize});
					break;

					case 38: self.onUpArrowClick({ e: e, matrixSize: matrixSize});
					break; 

					case 39: self.onRightArrowClick({ e: e, matrixSize: matrixSize});
					break;

					case 40: self.onDownArrowClick({ e: e, matrixSize: matrixSize});
					break;
				}
			});
		},

		generateNextPossibleNo: function () {
			var nextPossibleNoIndex = (this.lastPossibleNoIndex + 1) % this.possibleNumbers.length
				, startRowIndex = ((new Date()).getTime() % this.matrixSize) * this.matrixSize
				, currentRowIndex = startRowIndex
				, currentRowNode
				, currentNode
				, i = 0
				, isEmptyNodeFound = false
				, self = this
			;

			for (i = 0; i < this.matrixSize; i++) {
				currentRowNode = $("#" + currentRowIndex)[0];
				currentNode = currentRowNode;

				while (currentNode) {
					if (!currentNode.value) {
						currentNode.setValue(self.possibleNumbers[nextPossibleNoIndex]);
						isEmptyNodeFound = true;

						console.log('Empty Node: ', currentNode);
						break;
					}
										
					currentNode = currentNode.nextRightNode;
				}

				if (isEmptyNodeFound) break;

				// currentRowIndex = ((currentRowIndex + 1) % this.matrixSize) * this.matrixSize;
				// currentRowIndex += this.matrixSize;
				currentRowIndex = (currentRowIndex + this.matrixSize) 
				if (currentRowIndex >= this.matrixSize * this.matrixSize) {
					currentRowIndex = currentRowIndex % this.matrixSize;
				}

			}

			if (!isEmptyNodeFound) {
				console.log("Game Over");
			}

			this.lastPossibleNoIndex = nextPossibleNoIndex;
		},

		processNode: function (currentNode, moveDirection) {
			var isMoved, isSummed;

			isMoved = this.moveCloser(currentNode, moveDirection);
			isSummed = this.sumUp(currentNode, moveDirection);

			return isMoved || isSummed;
		},

		moveCloser: function (currentNode, moveDirection) {
			var nextNode = currentNode[moveDirection]
				, isMoved = false
			;

			while (nextNode) {
				if (!currentNode.value && !nextNode.value) {
					nextNode = nextNode[moveDirection];
					continue;
				}

				if (!currentNode.value && nextNode.value) {
					isMoved = true;
					currentNode.setValue(nextNode.value);
					nextNode.setValue();
				}

				currentNode = currentNode[moveDirection];
				nextNode = nextNode[moveDirection];
			}

			return isMoved;
		},

		sumUp: function (currentNode, moveDirection) {
			var nextNode = currentNode[moveDirection]
				, isSummed = false
			;

			while (nextNode) {
				if (currentNode.value && currentNode.value === nextNode.value) {
					currentNode.setValue(currentNode.value + nextNode.value);
					this.sumUpUIChange(currentNode);
					nextNode.setValue();
					this.moveCloser(currentNode, moveDirection);			
					nextNode = nextNode[moveDirection];
					isSummed = true
					continue;
				}

				// if (!currentNode.value && nextNode.value) {
				// 	currentNode.setValue(nextNode.value);
				// 	nextNode.setValue();
				// }

				currentNode = currentNode[moveDirection];
				nextNode = nextNode[moveDirection];
			}

			return isSummed;
		},

		sumUpUIChange: function (node) {
			node.style.transform = "scale(1.2, 1.2)";

			setTimeout(function () {
				node.style.transform = "";
			}, 100);
		},

		commonArrowClick: function (info) {
			var nodes = this[info.whichClick].nodes || 
				this.getNodes({ startIndex: info.startIndex, incrementBy: info.incrementBy, matrixSize: this.matrixSize })
				, self = this
				, isMovedOrSummed = false
			;

			this[info.whichClick].nodes = nodes;

			nodes.forEach( function (currentNode) {
				var result = self.processNode(currentNode, info.moveDirection);
				if (!isMovedOrSummed && result) isMovedOrSummed = true;
			});

			isMovedOrSummed && this.generateNextPossibleNo();

			console.log(info.whichClick + ': ', nodes);
		},

		onLeftArrowClick: function (info) {
			this.commonArrowClick({ 
				moveDirection: 'nextRightNode', 
				startIndex: 0,
				incrementBy: this.matrixSize,
				whichClick: 'onLeftArrowClick'
			});
		},

		onUpArrowClick: function (info) {
			this.commonArrowClick({ 
				moveDirection: 'nextDownNode', 
				startIndex: 0,
				incrementBy: 1,
				whichClick: 'onUpArrowClick'
			});
		},

		onRightArrowClick: function (info) {
			this.commonArrowClick({ 
				moveDirection: 'nextLeftNode', 
				startIndex: this.matrixSize - 1,
				incrementBy: this.matrixSize,
				whichClick: 'onRightArrowClick'
			});
		},


		onDownArrowClick: function (info) {
			this.commonArrowClick({ 
				moveDirection: 'nextUpNode', 
				startIndex: this.matrixSize * (this.matrixSize - 1),
				incrementBy: 1,
				whichClick: 'onDownArrowClick'
			});
		},

		getNodes: function (info) {
			var nodes = []
				, nodeId = info.startIndex
				, i = 0
			;

			console.log("getNodes called.");

			for (i = 0; i < info.matrixSize; i++) {
				nodes.push( $("#" + nodeId)[0] );
				nodeId += info.incrementBy;
			}

			return nodes;
		},

		createTiles: function (objGameContainer) {
			var noOfTiles = objGameContainer.noOfTiles;

			while (noOfTiles--) {
				this.createTile({ 
					node: objGameContainer.node, 
					nodeId: objGameContainer.noOfTiles - noOfTiles - 1, 
					// value: objGameContainer.noOfTiles - noOfTiles - 1
					value: ''
				});
			}
		},

		createTile: function (objGameContainer) {
			var newDiv = $("<div>", { id: objGameContainer.nodeId, class: "tile" })
				, contentDiv
				, self = this
			;

			contentDiv = this.createTileContent({ node: newDiv, value: objGameContainer.value} );

			newDiv.appendTo(objGameContainer.node);
			newDiv[0].setValue = function (newValue) {
				this.value = newValue;
				contentDiv.setValue(newValue);
				// this.style.backgroundColor = self.generateTileColor(newValue);
			};
			newDiv[0].setValue(objGameContainer.value);	

			return newDiv[0];		
		},

		generateTileColor: function (tileValue) {
			if (tileValue < 64) return "yellow";

			if (tileValue < 128) return "blue";

			if (tileValue < 256) return "green";
		},

		createTileContent: function (objTile) {
			var newDiv = $("<div>", { class: "content" });

			newDiv.appendTo(objTile.node);
			newDiv[0].setValue = function (newValue) {
				newValue = newValue || '';
				this.innerHTML = newValue;
			};
			newDiv[0].setValue(objTile.value);

			return newDiv[0];
		}
	};
}
