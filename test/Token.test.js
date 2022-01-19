import { assert, should } from "chai";
import { tokens,EVM_REVERT } from "./helper";
const Tachyontoken = artifacts.require('./Tachyontoken');

require('chai')
.use(require('chai-as-promised'))
.should()



contract('Tachyontoken', ([deployer,receiver,exchange])=> {
    const name = 'TACHYON';
    const symbol = 'TAC';
    const decimals = '18';
    const totalSupply = tokens(1000000).toString();


    let token 
    beforeEach(async ()=> {
        token = await Tachyontoken.new();
    })

    

    describe('deployment', async()=> {
        it('tracks the name', async() => {
            const result = await token.name();
            result.should.equal(name);
        }) 

        it('tracks the symbol', async() => {
            const result = await token.symbol();
            result.should.equal(symbol);
        })

        it('tracks the decimals', async() => {
            const result = await token.decimals();
            result.toString().should.equal(decimals);
        })

        it('tracks the totalSupply', async() => {
            const result = await token.totalSupply();
            result.toString().should.equal(totalSupply);
        })

        it('tracks the total supply to the deployer', async()=> {
            const result = await token.balanceOf(deployer);
            result.toString().should.equal(totalSupply.toString())

        })

      })


    

        describe('transfer of tokens', async()=> {
            
            let amount;
            let result;

            describe('success', async()=>{

                beforeEach(async ()=> {
                    amount = tokens(100);
                    result = await token.transfer(receiver, amount, {from : deployer });
    
                })
    
    
                it('transfers the tokens', async()=>{
    
                let balanceOf;
    
                balanceOf = await token.balanceOf(deployer);
                balanceOf.toString().should.equal(tokens(999900).toString());
    
                balanceOf = await token.balanceOf(receiver);
                balanceOf.toString().should.equal(tokens(100).toString());
    
                })
    
                it('emits a transfer event', async()=> {
                const log = result.logs[0]
                log.event.should.equal('Transfer');
                const event = log.args
                event._from.toString().should.equal(deployer, 'it is the deployer');
                event._to.toString().should.equal(receiver, 'receiver is correct');
                event._value.toString().should.equal(amount.toString());
                })

                describe('failure', async()=>{

                it('rejects insufficient balances', async()=> {
                    let invalidAmount
                    invalidAmount = tokens(10000000);
                    await token.transfer(receiver, invalidAmount, {from : deployer}).should.be.rejectedWith(EVM_REVERT);

                    invalidAmount = tokens(1000);
                    await token.transfer(deployer, invalidAmount, {from : receiver}).should.be.rejectedWith(EVM_REVERT);
                })

               it('it rejects invalid receipient', async()=>{
                await token.transfer(0x0, amount, {from : deployer}).should.be.rejected
               })



    
    
        })
    
    })
   
    })


        describe('approving tokens', async()=>{

            let amount  
            let result

            beforeEach(async()=>{
                amount = tokens(100)
                result = await token.approve(exchange, amount, {from : deployer});
            })

            describe('success', async()=> {
                it('allocates a value for delegated spending on exchange', async()=>{
                const allowance = await token.allowance(deployer,exchange);
                allowance.toString().should.equal(amount.toString());
                })

                it('emits the Approval event', async()=>{
                    const log = result.logs[0];
                    log.event.should.eq('Approval');
                    const event = log.args
                    event._owner.toString().should.equal(deployer, 'the owner is correct');
                    event._spender.toString().should.equal(exchange, 'the spender is correct');
                    event._value.toString().should.equal(amount.toString());
                })
                
            })

            describe('failure', async()=>{

                it('it rejects invalid spenders', async()=>{
                    await token.approve(0x0, amount, {from : deployer}).should.be.rejected
                   })
    
            
            })

        })


        describe('transfer of tokens', async()=> {
            
            let amount;
            let result;

            beforeEach(async()=>{
                amount = tokens(100);
                result = await token.approve(exchange, amount, {from : deployer});
                
            })

            describe('success', async()=>{

                beforeEach(async ()=> {
                    amount = tokens(100);
                    result = await token.transferFrom(deployer,receiver,amount, {from : exchange });
    
                })
    
    
                it('Delegated token transfers', async()=>{
    
                let balanceOf;
    
                balanceOf = await token.balanceOf(deployer);
                balanceOf.toString().should.equal(tokens(999900).toString());
    
                balanceOf = await token.balanceOf(receiver);
                balanceOf.toString().should.equal(tokens(100).toString());
    
                })

                it('resets the balance', async()=>{
                    
                    const allowance = await token.allowance(deployer,exchange);
                    allowance.toString().should.equal('0');
                })

                
    
                it('emits a transfer event', async()=> {
                const log = result.logs[0]
                log.event.should.equal('Transfer');
                const event = log.args
                event._from.toString().should.equal(deployer, 'it is the deployer');
                event._to.toString().should.equal(receiver, 'receiver is correct');
                event._value.toString().should.equal(amount.toString());
                })

               

                describe('failure', async()=>{

                it('rejects insufficient balances', async()=> {
                    let invalidAmount
                    invalidAmount = tokens(10000000);
                    await token.transferFrom(deployer,receiver, invalidAmount, {from : exchange}).should.be.rejectedWith(EVM_REVERT);

                })

               it('it rejects invalid receipient', async()=>{
                await token.transferFrom(deployer, 0x0, amount, {from : exchange}).should.be.rejected
               })



    
    
        })
    
    })
   
    })
        


    

        

})