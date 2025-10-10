import { useState, useEffect, useCallback } from 'react';
import { Contract, parseUnits, formatUnits } from 'ethers';
import { useWalletStore } from '@/state/walletStore';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import LoanFactoryABI from '@/contracts/abis/LoanFactory.json';
import ERC20ABI from '@/contracts/abis/MockERC20.json';
import { toast } from '@/hooks/use-toast';

export interface Loan {
  id: string;
  borrower: string;
  lender: string;
  amount: string;
  duration: string;
  interestRate: string;
  purpose: string;
  createdAt: string;
  fundedAt: string;
  repaidAt: string;
  status: 'Pending' | 'Funded' | 'Repaid' | 'Defaulted' | 'Cancelled';
  totalRepayment: string;
}

export const useLending = () => {
  const { provider, signer, address } = useWalletStore();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [borrowerLoans, setBorrowerLoans] = useState<Loan[]>([]);
  const [lenderLoans, setLenderLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalLoans: 0,
    totalVolumeFunded: '0',
  });

  const getLoanFactoryContract = useCallback(() => {
    if (!provider) return null;
    const runner = signer ?? provider;
    return new Contract(CONTRACT_ADDRESSES.LOAN_FACTORY, LoanFactoryABI, runner);
  }, [provider, signer]);

  const getLendingTokenContract = useCallback(() => {
    if (!provider) return null;
    const runner = signer ?? provider;
    return new Contract(CONTRACT_ADDRESSES.LENDING_TOKEN, ERC20ABI, runner);
  }, [provider, signer]);

  const formatLoan = (loan: any): Loan => ({
    id: loan.id.toString(),
    borrower: loan.borrower,
    lender: loan.lender,
    amount: formatUnits(loan.amount, 6),
    duration: loan.duration.toString(),
    interestRate: (Number(loan.interestRate) / 100).toString(),
    purpose: loan.purpose,
    createdAt: loan.createdAt.toString(),
    fundedAt: loan.fundedAt.toString(),
    repaidAt: loan.repaidAt.toString(),
    status: ['Pending', 'Funded', 'Repaid', 'Defaulted', 'Cancelled'][loan.status] as Loan['status'],
    totalRepayment: formatUnits(loan.totalRepayment, 6),
  });

  const fetchAllLoans = useCallback(async () => {
    const contract = getLoanFactoryContract();
    if (!contract) return;

    try {
      setIsLoading(true);
      const pendingLoans = await contract.getAllPendingLoans();
      const formattedLoans = pendingLoans.map(formatLoan);
      setLoans(formattedLoans);

      const counter = await contract.loanCounter();
      let totalVolume = 0n;
      
      for (let i = 0; i < Number(counter); i++) {
        const loan = await contract.getLoanDetails(i);
        if (loan.status >= 1) { // Funded or later
          totalVolume += loan.amount;
        }
      }

      setStats({
        totalLoans: Number(counter),
        totalVolumeFunded: formatUnits(totalVolume, 6),
      });
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getLoanFactoryContract]);

  const fetchUserLoans = useCallback(async () => {
    const contract = getLoanFactoryContract();
    if (!contract || !address) return;

    try {
      const borrowerLoanIds = await contract.getBorrowerLoans(address);
      const lenderLoanIds = await contract.getLenderLoans(address);

      const borrowerLoansData = await Promise.all(
        borrowerLoanIds.map((id: bigint) => contract.getLoanDetails(id))
      );
      const lenderLoansData = await Promise.all(
        lenderLoanIds.map((id: bigint) => contract.getLoanDetails(id))
      );

      setBorrowerLoans(borrowerLoansData.map(formatLoan));
      setLenderLoans(lenderLoansData.map(formatLoan));
    } catch (error) {
      console.error('Error fetching user loans:', error);
    }
  }, [getLoanFactoryContract, address]);

  const createLoan = async (
    amount: string,
    duration: number,
    interestRate: number,
    purpose: string
  ) => {
    const contract = getLoanFactoryContract();
    if (!contract || !signer) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const amountInWei = parseUnits(amount, 6);
      const interestRateBps = Math.floor(interestRate * 100);

      const tx = await contract.createLoan(amountInWei, duration, interestRateBps, purpose);
      await tx.wait();

      toast({
        title: "Success",
        description: "Loan request created successfully",
      });

      await fetchAllLoans();
      await fetchUserLoans();
    } catch (error: any) {
      console.error('Error creating loan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create loan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fundLoan = async (loanId: string) => {
    const contract = getLoanFactoryContract();
    const tokenContract = getLendingTokenContract();
    if (!contract || !tokenContract || !signer) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const loan = await contract.getLoanDetails(loanId);
      
      // Approve tokens
      const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.LOAN_FACTORY, loan.amount);
      await approveTx.wait();

      // Fund loan
      const fundTx = await contract.fundLoan(loanId);
      await fundTx.wait();

      toast({
        title: "Success",
        description: "Loan funded successfully",
      });

      await fetchAllLoans();
      await fetchUserLoans();
    } catch (error: any) {
      console.error('Error funding loan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fund loan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disburseLoan = async (loanId: string) => {
    const contract = getLoanFactoryContract();
    if (!contract || !signer) return;

    try {
      setIsLoading(true);
      const tx = await contract.disburseLoan(loanId);
      await tx.wait();

      toast({
        title: "Success",
        description: "Loan disbursed successfully",
      });

      await fetchUserLoans();
    } catch (error: any) {
      console.error('Error disbursing loan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to disburse loan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const repayLoan = async (loanId: string) => {
    const contract = getLoanFactoryContract();
    const tokenContract = getLendingTokenContract();
    if (!contract || !tokenContract || !signer) return;

    try {
      setIsLoading(true);
      const loan = await contract.getLoanDetails(loanId);
      
      // Approve tokens
      const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.LOAN_FACTORY, loan.totalRepayment);
      await approveTx.wait();

      // Repay loan
      const repayTx = await contract.repayLoan(loanId);
      await repayTx.wait();

      toast({
        title: "Success",
        description: "Loan repaid successfully",
      });

      await fetchUserLoans();
    } catch (error: any) {
      console.error('Error repaying loan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to repay loan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTokenBalance = async (): Promise<string> => {
    const tokenContract = getLendingTokenContract();
    if (!tokenContract || !address) return '0';

    try {
      const balance = await tokenContract.balanceOf(address);
      return formatUnits(balance, 6);
    } catch (error) {
      console.error('Error getting token balance:', error);
      return '0';
    }
  };

  const mintTokens = async (amount: string) => {
    const tokenContract = getLendingTokenContract();
    if (!tokenContract || !signer || !address) return;

    try {
      const amountInWei = parseUnits(amount, 6);
      const tx = await tokenContract.faucet(address, amountInWei);
      await tx.wait();

      toast({
        title: "Success",
        description: `Minted ${amount} USDC tokens`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mint tokens",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (provider) {
      fetchAllLoans();
      if (address) {
        fetchUserLoans();
      }
    }
  }, [provider, address, fetchAllLoans, fetchUserLoans]);

  return {
    loans,
    borrowerLoans,
    lenderLoans,
    isLoading,
    stats,
    createLoan,
    fundLoan,
    disburseLoan,
    repayLoan,
    getTokenBalance,
    mintTokens,
    refreshLoans: fetchAllLoans,
  };
};
