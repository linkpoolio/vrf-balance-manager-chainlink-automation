//SPDX-License-Identifier: MIT
pragma solidity <=0.8.17;

import "./Child.sol";
import "./CloneFactory.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Factory is CloneFactory {
    using Counters for Counters.Counter;

    struct Tenant {
        Child child;
        address owner;
    }

    Counters.Counter public tenantCounter;
    mapping(address => Tenant) public tenants;
    mapping(address => bool) public instance;

    Child[] public children;
    uint256 disabledCount;
    address public immutable owner;
    address public masterContract;

    event TenantCreated(address _tenant, address _proxy);

    error Unauthorized();
    error InstanceAlreadyInitialized();
    error InstanceDoesNotExist();
    error ZeroAddress();

    modifier isAuthorized(address _tenant) {
        if (_tenant == address(0)) {
            revert ZeroAddress();
        }
        if (!(msg.sender == _tenant || msg.sender == owner)) {
            revert Unauthorized();
        }
        _;
    }

    modifier hasAnInstance(address _tenant) {
        if (instance[_tenant]) {
            revert InstanceAlreadyInitialized();
        }
        _;
    }

    constructor(address _masterContract, address _owner) {
        masterContract = _masterContract;
        owner = _owner;
    }

    function createInstance(
        address _tenant,
        uint256 _interval,
        uint256 _minBalance,
        uint256 _topUpAmount,
        address _dex,
        address _LINK,
        address _WETH
    ) external isAuthorized(_tenant) hasAnInstance(_tenant) {
        Child child = Child(createClone(masterContract));

        //initializing tenant state of clone
        child.initialize(
            _tenant,
            _interval,
            _minBalance,
            _topUpAmount,
            _dex,
            _LINK,
            _WETH
        );

        //set Tenant data
        Tenant storage newTenant = tenants[_tenant];
        newTenant.child = child;
        newTenant.owner = _tenant;
        instance[_tenant] = true;
        tenantCounter.increment();

        emit TenantCreated(_tenant, address(child));
    }

    function getProxy(address _tenant) public view returns (Child) {
        if (!instance[_tenant]) {
            revert InstanceDoesNotExist();
        }
        return tenants[_tenant].child;
    }
}
