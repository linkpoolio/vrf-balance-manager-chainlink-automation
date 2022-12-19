Summary
 - [reentrancy-no-eth](#reentrancy-no-eth) (1 results) (Medium)
 - [reentrancy-events](#reentrancy-events) (5 results) (Low)
 - [timestamp](#timestamp) (2 results) (Low)
 - [assembly](#assembly) (1 results) (Informational)
 - [solc-version](#solc-version) (4 results) (Informational)
 - [naming-convention](#naming-convention) (4 results) (Informational)
## reentrancy-no-eth
Impact: Medium
Confidence: Medium
 - [ ] ID-0
Reentrancy in [VRFBalancer._topUp(uint64[])](contracts/VRFBalancer.sol#L222-L257):
	External calls:
	- [success = erc677Link.transferAndCall(address(COORDINATOR),target.topUpAmount,abi.encode(needsFunding[idx]))](contracts/VRFBalancer.sol#L238-L242)
	State variables written after the call(s):
	- [s_targets[needsFunding[idx]].lastTopUpTimestamp = uint56(block.timestamp)](contracts/VRFBalancer.sol#L245-L247)

contracts/VRFBalancer.sol#L222-L257


## reentrancy-events
Impact: Low
Confidence: Medium
 - [ ] ID-1
Reentrancy in [VRFBalancer._topUp(uint64[])](contracts/VRFBalancer.sol#L222-L257):
	External calls:
	- [success = erc677Link.transferAndCall(address(COORDINATOR),target.topUpAmount,abi.encode(needsFunding[idx]))](contracts/VRFBalancer.sol#L238-L242)
	Event emitted after the call(s):
	- [TopUpFailed(needsFunding[idx])](contracts/VRFBalancer.sol#L250)
	- [TopUpSucceeded(needsFunding[idx])](contracts/VRFBalancer.sol#L248)

contracts/VRFBalancer.sol#L222-L257


 - [ ] ID-2
Reentrancy in [VRFBalancer._pegSwap()](contracts/VRFBalancer.sol#L483-L495):
	External calls:
	- [pegSwapRouter.swap(erc20Link.balanceOf(address(this)),address(erc20Link),address(erc677Link))](contracts/VRFBalancer.sol#L485-L489)
	Event emitted after the call(s):
	- [PegSwapSuccess(erc677Link.balanceOf(address(this)),address(erc20Link),address(erc677Link))](contracts/VRFBalancer.sol#L490-L494)

contracts/VRFBalancer.sol#L483-L495


 - [ ] ID-3
Reentrancy in [VRFBalancer.performUpkeep(bytes)](contracts/VRFBalancer.sol#L274-L298):
	External calls:
	- [_dexSwap(address(erc20Asset),address(erc20Link),erc20Asset.balanceOf(address(this)))](contracts/VRFBalancer.sol#L283-L287)
		- [amounts = dexRouter.swapExactTokensForTokens(amount,1,path,address(this),block.timestamp)](contracts/VRFBalancer.sol#L463-L469)
	- [_pegSwap()](contracts/VRFBalancer.sol#L288)
		- [pegSwapRouter.swap(erc20Link.balanceOf(address(this)),address(erc20Link),address(erc677Link))](contracts/VRFBalancer.sol#L485-L489)
	- [_dexSwap(address(erc20Asset),address(erc677Link),erc20Asset.balanceOf(address(this)))](contracts/VRFBalancer.sol#L290-L294)
		- [amounts = dexRouter.swapExactTokensForTokens(amount,1,path,address(this),block.timestamp)](contracts/VRFBalancer.sol#L463-L469)
	- [_topUp(needsFunding)](contracts/VRFBalancer.sol#L296)
		- [success = erc677Link.transferAndCall(address(COORDINATOR),target.topUpAmount,abi.encode(needsFunding[idx]))](contracts/VRFBalancer.sol#L238-L242)
	Event emitted after the call(s):
	- [TopUpFailed(needsFunding[idx])](contracts/VRFBalancer.sol#L250)
		- [_topUp(needsFunding)](contracts/VRFBalancer.sol#L296)
	- [TopUpSucceeded(needsFunding[idx])](contracts/VRFBalancer.sol#L248)
		- [_topUp(needsFunding)](contracts/VRFBalancer.sol#L296)

contracts/VRFBalancer.sol#L274-L298


 - [ ] ID-4
Reentrancy in [VRFBalancer.performUpkeep(bytes)](contracts/VRFBalancer.sol#L274-L298):
	External calls:
	- [_dexSwap(address(erc20Asset),address(erc20Link),erc20Asset.balanceOf(address(this)))](contracts/VRFBalancer.sol#L283-L287)
		- [amounts = dexRouter.swapExactTokensForTokens(amount,1,path,address(this),block.timestamp)](contracts/VRFBalancer.sol#L463-L469)
	- [_pegSwap()](contracts/VRFBalancer.sol#L288)
		- [pegSwapRouter.swap(erc20Link.balanceOf(address(this)),address(erc20Link),address(erc677Link))](contracts/VRFBalancer.sol#L485-L489)
	Event emitted after the call(s):
	- [PegSwapSuccess(erc677Link.balanceOf(address(this)),address(erc20Link),address(erc677Link))](contracts/VRFBalancer.sol#L490-L494)
		- [_pegSwap()](contracts/VRFBalancer.sol#L288)

contracts/VRFBalancer.sol#L274-L298


 - [ ] ID-5
Reentrancy in [VRFBalancer._dexSwap(address,address,uint256)](contracts/VRFBalancer.sol#L455-L471):
	External calls:
	- [amounts = dexRouter.swapExactTokensForTokens(amount,1,path,address(this),block.timestamp)](contracts/VRFBalancer.sol#L463-L469)
	Event emitted after the call(s):
	- [DexSwapSuccess(amounts[1],fromToken,toToken)](contracts/VRFBalancer.sol#L470)

contracts/VRFBalancer.sol#L455-L471


## timestamp
Impact: Low
Confidence: Medium
 - [ ] ID-6
[VRFBalancer._topUp(uint64[])](contracts/VRFBalancer.sol#L222-L257) uses timestamp for comparisons
	Dangerous comparisons:
	- [target.isActive && target.lastTopUpTimestamp + _minWaitPeriodSeconds <= block.timestamp && subscriptionBalance < target.minBalance && contractBalance >= target.topUpAmount](contracts/VRFBalancer.sol#L232-L236)

contracts/VRFBalancer.sol#L222-L257


 - [ ] ID-7
[VRFBalancer._getUnderfundedSubscriptions()](contracts/VRFBalancer.sol#L184-L210) uses timestamp for comparisons
	Dangerous comparisons:
	- [target.lastTopUpTimestamp + minWaitPeriod <= block.timestamp && subscriptionBalance < target.minBalance](contracts/VRFBalancer.sol#L201-L202)

contracts/VRFBalancer.sol#L184-L210


## assembly
Impact: Informational
Confidence: High
 - [ ] ID-8
[console._sendLogPayload(bytes)](node_modules/hardhat/console.sol#L7-L14) uses assembly
	- [INLINE ASM](node_modules/hardhat/console.sol#L10-L13)

node_modules/hardhat/console.sol#L7-L14


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-9
solc-0.6.6 is not recommended for deployment

 - [ ] ID-10
Pragma version[>=0.4.22<0.9.0](node_modules/hardhat/console.sol#L2) is too complex

node_modules/hardhat/console.sol#L2


 - [ ] ID-11
solc-0.8.17 is not recommended for deployment

 - [ ] ID-12
Pragma version[<=0.8.17](contracts/VRFBalancer.sol#L2) uses lesser than

contracts/VRFBalancer.sol#L2


## naming-convention
Impact: Informational
Confidence: High
 - [ ] ID-13
Contract [console](node_modules/hardhat/console.sol#L4-L1532) is not in CapWords

node_modules/hardhat/console.sol#L4-L1532


 - [ ] ID-14
Variable [VRFBalancer.s_watchList](contracts/VRFBalancer.sol#L29) is not in mixedCase

contracts/VRFBalancer.sol#L29


 - [ ] ID-15
Variable [VRFBalancer.COORDINATOR](contracts/VRFBalancer.sol#L19) is not in mixedCase

contracts/VRFBalancer.sol#L19


 - [ ] ID-16
Variable [VRFBalancer.s_targets](contracts/VRFBalancer.sol#L51) is not in mixedCase

contracts/VRFBalancer.sol#L51


