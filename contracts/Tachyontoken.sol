// SPDX-License-Identifier: MIT
pragma solidity^0.8.1;

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";


contract Tachyontoken {
    using SafeMath for uint;
    address public admin;
    string  public name = "TACHYON";
    string  public symbol = "TAC";
    uint256 public totalSupply;  // 1 million tokens
    uint256 public decimals = 18;

    constructor() {
        totalSupply = 1000000 * ( 10 ** decimals);
        balanceOf[msg.sender] = totalSupply;
    }
    
    // constructor() ERC20('TACHYON','TAC'){
    //     _mint(msg.sender,1000000 * 10 ** 18);
    //     admin = msg.sender;
        
    // }

    event Transfer(
        address indexed _from,
        address indexed _to,
        uint256 _value
    );

    event Approval(address indexed _owner,
        address indexed _spender,
        uint256 _value);


    mapping(address => uint256)public balanceOf;
    mapping(address => mapping(address => uint256))public allowance;
    

       function transfer(address _to, uint256 _amount) public returns(bool success){
        require(balanceOf[msg.sender] >= _amount);
        _transfer(msg.sender,_to,_amount);
        return true;

       }

       function _transfer(address _from, address _to, uint _amount) internal returns(bool success){
        require(_to != address(0));
        balanceOf[_from] = balanceOf[_from].sub(_amount);
        balanceOf[_to] = balanceOf[_to].add(_amount);
        emit Transfer(_from, _to, _amount);
        return true;

       }

       function transferFrom(address _from, address _to, uint _amount)public returns(bool success){
        require(_amount <= balanceOf[_from]);
        require(_amount <= allowance[_from][msg.sender]);
        allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_amount);
        _transfer(_from, _to, _amount);
        return true;
       }

        function approve(address spender, uint256 amount) public  returns (bool success) {
         require(spender != address(0));
         allowance[msg.sender][spender] = amount;
         emit Approval(msg.sender, spender, amount);
         return true;
     }




    // function mint(address to, uint amount) external {
    //     require(msg.sender == admin, "Access denied");
    //     _mint(to,amount);
    // }
    
    // function burn(uint amount) external {
    //     _burn(msg.sender, amount);
    // }
    

      
}