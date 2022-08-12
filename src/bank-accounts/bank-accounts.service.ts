import { Inject, Injectable, Scope } from '@nestjs/common';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { Repository, DataSource } from 'typeorm';
import { BankAccount } from './entities/bank-account.entity';
import { InjectRepository, getDataSourceToken } from '@nestjs/typeorm';
import console from 'console';

@Injectable({
  //scope: Scope.REQUEST
  //durable: true
})
export class BankAccountsService {
  constructor(
    @InjectRepository(BankAccount)
    private repo: Repository<BankAccount>,
    @Inject(getDataSourceToken())
    private dataSource: DataSource
  ) {}

  async create(createBankAccountDto: CreateBankAccountDto) {
    const bankAccount = this.repo.create({
      account_number: createBankAccountDto.account_number,
      balance: 0,
    });

    await this.repo.insert(bankAccount);
    return bankAccount;
  }

  findAll() {
    return this.repo.find();
  }

  findOne(id: string) {
    return this.repo.findOneBy({ id });
  }

  async transfer(from: string, to: string, amount: number) {
    //modo transaçâo
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      
      await queryRunner.startTransaction();
      const fromAccount = await this.repo.findOneBy({ account_number: from });
      const toAccount = await this.repo.findOneBy({ account_number: to });

      fromAccount.balance -= amount;
      toAccount.balance += amount;

      this.repo.save(fromAccount);
      this.repo.save(toAccount);
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      console.error(e);
      throw e;
    }
  }
}
