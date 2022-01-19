import { assert, should } from "chai";
import { ether, tokens,EVM_REVERT,ETHER_ADDRESS} from "./helper";
const Exchange = artifacts.require('./Exchange');
const Tachyontoken = artifacts.require('./Tachyontoken');

require('chai')
.use(require('chai-as-promised'))
.should()



contract('Exchange', ([deployer, feeAccount , user1, user2])=> {


    let exchange 
    const feePercent = 1;
    let token
    
    beforeEach(async ()=> {
        
        token = await Tachyontoken.new();
        await token.transfer(user1,tokens(100), {from :deployer});
        exchange = await Exchange.new(feeAccount, feePercent);
        
        
        
    })

    

    describe('deployment', async()=> {
        it('tracks the feeAccount', async() => {
            const result = await exchange.feeAccount() ;
            result.should.equal(feeAccount);
        }) 

        it('tracks the feePercent', async() => {
            const result = await exchange.feePercent() ;
            result.toString().should.equal(feePercent.toString());
        }) 


      })


      describe('Fallback', async()=> {
        it('catches when ether is sent directly and reverts' , async()=> {
            await exchange.sendTransaction({ value: 1, from : user1}).should.be.rejectedWith(EVM_REVERT);
        }) 
     })

      describe('Depositing Ether', ()=>{
          let result
          let amount  

            beforeEach(async() => {
                amount = ether(1);
                result = await exchange.depositEther({from : user1 , value: amount})
            })

            it('tracks the ether deposit', async()=> {
                
                const balance = await exchange.tokens(ETHER_ADDRESS, user1);
                balance.toString().should.equal(amount.toString());
            })

            it('emits a Deposit event', async()=> {
                const log = result.logs[0];
                log.event.should.equal('Deposit');
                const event = log.args
                event.token.toString().should.equal(ETHER_ADDRESS, 'it is the deployer');
                event.user.toString().should.equal(user1, 'receiver is correct');
                event.amount.toString().should.equal(amount.toString());
                event.balance.toString().should.equal(amount.toString());
                })



      })

      describe('Depositing tokens', ()=>{
        describe('success', async()=> {

            let amount 
            let result 
    
    
            beforeEach(async()=>{
                amount = tokens(10);
                await token.approve(exchange.address, amount, {from:user1})
                result = await exchange.depositToken(token.address, amount , {from:user1})
            })
            
                it('tracks the deposit', async()=> {
                    let balance
                    balance = await token.balanceOf(exchange.address);
                    balance.toString().should.equal(amount.toString());
                    //Check the deposit
                    balance = await exchange.tokens(token.address,user1);
                    balance.toString().should.equal(amount.toString());
    
                })
    
    
                
                it('emits a Deposit event', async()=> {
                    const log = result.logs[0];
                    log.event.should.equal('Deposit');
                    const event = log.args
                    event.token.toString().should.equal(token.address, 'it is the deployer');
                    event.user.toString().should.equal(user1, 'receiver is correct');
                    event.amount.toString().should.equal(amount.toString());
                    event.balance.toString().should.equal(amount.toString());
                    })
    
    
        })
    
          describe('failure', async()=> {
    
                it('Rejects ether', async()=>{
                    await exchange.depositToken(ETHER_ADDRESS, tokens(10) , {from:user1}).should.be.rejectedWith(EVM_REVERT);
                })
    
                it('Fails when no tokens are approved', async()=>{
                    await exchange.depositToken(token.address, tokens(10) , {from:user1}).should.be.rejectedWith(EVM_REVERT);
                })
            
    
    
    
        })
      })

      describe('Withdrawing Ether', ()=>{

        let amount;
        let result;
        
        beforeEach(async()=>{
            amount = ether(1)
            await exchange.depositEther({from:user1, value : amount});

        })

        beforeEach(async()=>{
            result = await exchange.WithdrawEther(amount, {from :user1});

        })

        describe('success', async()=>{

            it('checks withdrawal of ether is done', async()=>{
                let balance = await exchange.tokens(ETHER_ADDRESS,user1);
                balance.toString().should.equal('0')
            })

            it('emits a withdraw event', async()=> {
                const log = result.logs[0];
                log.event.should.equal('Withdraw');
                const event = log.args
                event.token.toString().should.equal(ETHER_ADDRESS, 'it is the deployer');
                event.user.toString().should.equal(user1, 'receiver is correct');
                event.amount.toString().should.equal(amount.toString());
                event.balance.toString().should.equal('0');
                })
        })

        describe('failure', async()=>{
            it('rejects excess withdrawal', async()=> {
                await exchange.WithdrawEther(ether(100), {from :user1}).should.be.rejectedWith(EVM_REVERT);
            })
            
        })


      })

      describe('Withdrawing Token', ()=>{


        let result 
        let amount 


        describe('success', async()=>{

            beforeEach(async()=>{
                amount = tokens(10);
                await token.approve(exchange.address, amount, {from :user1})
                await exchange.depositToken(token.address,amount, {from : user1}); 

                //withdrawal
                result = await exchange.WithdrawToken(token.address, amount, { from : user1});

            })

                it('checks token withdrawals', async()=>{
                    let balance
                    balance = await exchange.tokens(token.address,user1) ;
                    balance.toString().should.equal('0');

                })

                it('emits a withdraw event', async()=> {
                    const log = result.logs[0];
                    log.event.should.equal('Withdraw');
                    const event = log.args
                    event.token.toString().should.equal(token.address, 'it is the deployer');
                    event.user.toString().should.equal(user1, 'receiver is correct');
                    event.amount.toString().should.equal(amount.toString());
                    event.balance.toString().should.equal('0');
                    })

        })

        describe('failure', async()=>{

            it('Rejects ether withdrawal', async()=>{
                await exchange.WithdrawToken(ETHER_ADDRESS, tokens(10) , {from:user1}).should.be.rejectedWith(EVM_REVERT);
            })

            it('Rejects excess token withdrawal', async()=>{
                await exchange.WithdrawToken(token.address, tokens(10) , {from:user1}).should.be.rejectedWith(EVM_REVERT);
            })


        })


        describe('checking balance', async()=>{
            beforeEach(async()=>{
                await exchange.depositEther({ from : user1, value : ether(1)})
            })

            it('checks the balance', async()=> {
               let balance = await exchange.balanceOf(ETHER_ADDRESS,user1);
               balance.toString().should.equal(ether(1).toString())
            })
        })


      })

      describe('making an order', async()=> {

        let result

        beforeEach(async()=>{
            result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), {from : user1});
        })

        it('tracks a newly created order', async()=> {
            const orderCount = await exchange.orderCount();
            orderCount.toString().should.equal('1');
            const order = await exchange.orders('1');
            order.id.toString().should.equal('1','id is correct');
            order.user.should.equal(user1 ,'user is correct');
            order.tokenGet.should.equal(token.address, 'token address is correct');
            order.amountGet.toString().should.equal(tokens(1).toString(), 'token to give is correct');
            order.tokenGive.should.equal(ETHER_ADDRESS,'token address is correct');
            order.amountGive.toString().should.equal(ether(1).toString(), 'token to get is correct');
            order.timestamp.toString().length.should.be.at.least(1, 'timestamp exists');
        })


        it('emits the order event', async()=> {
            const log = result.logs[0];
            log.event.should.equal('Order');
            const event = log.args;
            event.id.toString().should.equal('1','id is correct');
            event.user.should.equal(user1 ,'user is correct');
            event.tokenGet.should.equal(token.address, 'token address is correct');
            event.amountGet.toString().should.equal(tokens(1).toString(), 'token to give is correct');
            event.tokenGive.should.equal(ETHER_ADDRESS,'token address is correct');
            event.amountGive.toString().should.equal(ether(1).toString(), 'token to get is correct');
            event.timestamp.toString().length.should.be.at.least(1, 'timestamp exists');
        })


            
      })

      describe('order processes', async()=>{

        beforeEach(async()=>{
            //user1 deposits only ether
            await exchange.depositEther({ from:user1, value: ether(1)})
            //give tokens to user2
            await token.transfer(user2, tokens(100),{from:deployer});
            //user2 deposits 2 tokens only
            await token.approve(exchange.address, tokens(2),{from:user2});
            await exchange.depositToken(token.address, tokens(2),{from : user2});
            //user1 makes order to buy tokens with Ether
            await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1),{from : user1});
        })

        describe('filling orders', async()=>{
            let result

            describe('success', async()=>{
                 beforeEach(async()=>{
                    //user2 fills order
                result = await exchange.fillOrder('1',{from:user2});
                })

                  it('executes trade and charges fees', async()=>{
                    let balance
                    balance = await exchange.balanceOf(token.address, user1);
                    balance.toString().should.equal(tokens(1).toString(), 'user1 received tokens');
                    balance = await exchange.balanceOf(ETHER_ADDRESS, user2);
                    balance.toString().should.equal(ether(1).toString(), 'user2  receives ether');
                    balance = await exchange.balanceOf(ETHER_ADDRESS, user1);
                    balance.toString().should.equal('0', 'user1 ether');
                    balance = await exchange.balanceOf(token.address, user2);
                    balance.toString().should.equal(tokens(0.99).toString(), 'user2 tokens with fee applied');
                   

                    const feeAccount = await exchange.feeAccount();
                    balance = await exchange.balanceOf(token.address, feeAccount);
                    balance.toString().should.equal(tokens(0.01).toString(), 'fee received by account');
                })

                it('updates the filled orders', async()=>{
                    const orderfilled = await exchange.orderFilled(1);
                    orderfilled.should.equal(true);
                })

                it('emits a Trade Event', async()=>{
                    const log = result.logs[0];
                    log.event.should.equal('Trade');
                    const event = log.args;
                    event.id.toString().should.equal('1','id is correct');
                    event.user.should.equal(user1 ,'user is correct');
                    event.tokenGet.should.equal(token.address, 'token address is correct');
                    event.amountGet.toString().should.equal(tokens(1).toString(), 'token to give is correct');
                    event.tokenGive.should.equal(ETHER_ADDRESS,'token address is correct');
                    event.amountGive.toString().should.equal(ether(1).toString(), 'token to get is correct');
                    event.userFill.should.equal(user2 ,'user is correct');
                    event.timestamp.toString().length.should.be.at.least(1, 'timestamp exists');
                })
            })

                describe('failure', async()=>{
                    it('rejects invalid order ids', async()=>{
                    const invalidId = 9999;
                    await exchange.cancelOrder(invalidId, {from : user2}).should.be.rejectedWith(EVM_REVERT);
        
                    })
        
                    it('rejects already filled orders', async()=>{
                        //fill order
                        await exchange.fillOrder('1', {from:user2}).should.be.fulfilled;
                        //try to fill it again
                        await exchange.fillOrder('1', {from:user2}).should.be.rejectedWith(EVM_REVERT);
                    })
        
                    it('rejects cancelled orders', async()=>{
                        //fill order
                        await exchange.cancelOrder('1', {from:user1}).should.be.fulfilled;
                        //try to fill it again
                        await exchange.fillOrder('1', {from:user2}).should.be.rejectedWith(EVM_REVERT);
                    })
        
                   
                 })
                
            

        })

        describe('cancelling orders', async()=>{
            let result

            describe('success', async()=>{
                beforeEach(async()=> {
                    result = await exchange.cancelOrder(1, {from : user1})
                })

                it('updates the order', async()=>{
                    const orderCancelled = await exchange.orderCancelled(1);
                    orderCancelled.should.equal(true);
                })

                it('emits a Cancel event', async()=> {
                    const log = result.logs[0];
                    log.event.should.equal('OrderCancelled');
                    const event = log.args;
                    event.id.toString().should.equal('1', 'the id is correct');
                    event.user.should.equal(user1 ,'user is correct');
                    event.tokenGet.should.equal(token.address, 'token address is correct');
                    event.amountGet.toString().should.equal(tokens(1).toString(), 'token to give is correct');
                    event.tokenGive.should.equal(ETHER_ADDRESS,'token address is correct');
                    event.amountGive.toString().should.equal(ether(1).toString(), 'token to get is correct');
                    event.timestamp.toString().length.should.be.at.least(1, 'timestamp exists');
                })
        


            })

            describe('failure', async()=>{
                it('rejects invalid order ids', async()=>{
                    const invalidId = 9999;
                    await exchange.cancelOrder(invalidId, {from : user1}).should.be.rejectedWith(EVM_REVERT);
        
                    })

                it('rejects unauthorised cancellations', async()=>{
                    await exchange.cancelOrder('1', {from : user2}).should.be.rejectedWith(EVM_REVERT);
                    })

                
            })


            

         })
    

       
    })

    

        

})