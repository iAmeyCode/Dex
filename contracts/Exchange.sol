// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "./Tachyontoken.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";


// Functionality :

//  Set a fee Ac;       -- tested
//  Deposit Ether;      -- tested
//  Withdraw Ether;     -- tested
//  Deposit Tokens;     -- tested
//  Withdraw Tokens;    -- tested
//  Check Balances;     -- tested
//  Make order;         -- tested
//  Cancel Order;       -- tested
//  Fill Order;
//  Charge Fees;

contract Exchange{
    using SafeMath for uint;


    address public feeAccount;
    uint256 public feePercent;
    address constant ETHER = address(0); //sets the address as blank, helps store ether in tokens mapping
    mapping(address => mapping(address => uint))public tokens;
    mapping(uint256 => _Order) public orders;  
    uint256 public orderCount;
    mapping(uint256 => bool) public orderCancelled;
    mapping(uint256 => bool) public orderFilled;


        //Events

        event Deposit        (address token, address user, uint256 amount, uint256 balance);
        event Withdraw       (address token, address user, uint256 amount, uint256 balance);
        event Order          (uint id, address user, address tokenGet,uint amountGet, address tokenGive, uint amountGive,  uint timestamp);
        event OrderCancelled (uint id, address user, address tokenGet,uint amountGet, address tokenGive, uint amountGive,  uint timestamp);
        event Trade          (uint id, address user, address tokenGet,uint amountGet, address tokenGive, uint amountGive, address userFill, uint timestamp);    
        

        struct _Order{
            uint    id;
            address user;
            address tokenGet;
            uint    amountGet;
            address tokenGive;
            uint    amountGive;
            uint    timestamp;
        }


        constructor(address _feeAccount, uint256 _feePercent) {
            feeAccount = _feeAccount;
            feePercent = _feePercent;

        }

    fallback() external{
        revert();
    }

    function WithdrawEther(uint _amount) public  {
        require(tokens[ETHER][msg.sender] >= _amount);
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
        payable(msg.sender).transfer(_amount);
        emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
    }

    function WithdrawToken(address _token, uint _amount)public {
        require(_token != ETHER);
        require(tokens[_token][msg.sender] >= _amount);
        tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
        require(Tachyontoken(_token).transfer(msg.sender,_amount));
         emit Withdraw(_token, msg.sender, _amount, tokens[ETHER][msg.sender]);

    }

    function depositEther() public payable{
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    function depositToken(address _token, uint _amount)public {
        require(_token != ETHER);
        require(Tachyontoken(_token).transferFrom(msg.sender, address(this),_amount));
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);

    }


    function balanceOf(address _token, address user) public view returns(uint256){
        return tokens[_token][user];
    }

    function makeOrder(address _tokenGet, uint _amountGet, address _tokenGive, uint _amountGive)public {
        orderCount = orderCount.add(1);
        orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet,_amountGet, _tokenGive, _amountGive, block.timestamp);
        emit Order(orderCount, msg.sender, _tokenGet,_amountGet, _tokenGive, _amountGive, block.timestamp);
    }


    function cancelOrder(uint256 _id) public{
        _Order storage _order = orders[_id];
        require(address(_order.user) == msg.sender);
        require(_order.id == _id);
        orderCancelled[_id] = true;
        emit OrderCancelled(_order.id, msg.sender,  _order.tokenGet, _order.amountGet,  _order.tokenGive,  _order.amountGive,  _order.timestamp);
    }


    function fillOrder(uint _id) public{
        require(_id > 0 && _id <= orderCount);
        require(!orderCancelled[_id]);
        require(!orderFilled[_id]);
        _Order storage _order = orders[_id];
        _trade(_order.id, _order.user,  _order.tokenGet, _order.amountGet,  _order.tokenGive,  _order.amountGive);
        orderFilled[_order.id] = true;
            }

    function _trade(uint _orderid, address _user, address _tokenGet, uint _amountGet, address _tokenGive, uint _amountGive)internal{
        // fee is given by the person who fills order       
        uint _feeAmount = _amountGive.mul(feePercent).div(100);

        tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(_amountGet.add(_feeAmount));
        tokens[_tokenGet][_user] = tokens[_tokenGet][_user].add(_amountGet);
        tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount].add(_feeAmount);
        tokens[_tokenGive][_user] = tokens[_tokenGive][_user].sub(_amountGive);
        tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender].add(_amountGive);
        
        emit Trade(_orderid, _user,  _tokenGet, _amountGet,  _tokenGive,  _amountGive, msg.sender,  block.timestamp);
    }

}
