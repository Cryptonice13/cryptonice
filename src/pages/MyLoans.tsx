import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Eye, X, CreditCard, Calendar, DollarSign, FileText, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
interface LoanRequest {
  id: string;
  loan_amount: number;
  duration_months: number;
  purpose: string;
  status: string;
  created_at: string;
  business_name?: string;
  owner_name: string;
  country: string;
  income_estimate?: number;
  id_proof_hash?: string;
  business_registration_hash?: string;
  updated_at: string;
}
const statusColors = {
  'Pending Review': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Approved': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Funded': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Rejected': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Cancelled': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};
export default function MyLoans() {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedLoan, setSelectedLoan] = useState<LoanRequest | null>(null);
  useEffect(() => {
    if (user) {
      fetchLoans();
    }
  }, [user]);
  const fetchLoans = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('loan_requests').select('*').eq('user_id', user?.id).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch loan applications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const cancelLoan = async (loanId: string) => {
    try {
      const {
        error
      } = await supabase.from('loan_requests').update({
        status: 'Cancelled'
      }).eq('id', loanId).eq('user_id', user?.id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Loan application cancelled successfully"
      });
      fetchLoans();
    } catch (error) {
      console.error('Error cancelling loan:', error);
      toast({
        title: "Error",
        description: "Failed to cancel loan application",
        variant: "destructive"
      });
    }
  };
  const filteredLoans = loans.filter(loan => {
    if (filter === 'All') return true;
    return loan.status === filter;
  });
  const activeLoan = loans.find(loan => loan.status === 'Funded');
  if (loading) {
    return <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/home")}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <h1 className="text-3xl font-bold mb-4 sm:mb-0">My Loan Applications</h1>
          
          <div className="flex items-center gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48 bg-[#111] border-gray-700">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-gray-700">
                <SelectItem value="All">All Applications</SelectItem>
                <SelectItem value="Pending Review">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Funded">Funded</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {activeLoan && <Card className="bg-[#111] border-green-500/30 mb-8 hover:shadow-lg hover:shadow-green-400/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Active Loan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Loan Amount</p>
                  <p className="text-2xl font-bold">${activeLoan.loan_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Duration</p>
                  <p className="text-xl">{activeLoan.duration_months} months</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Remaining Balance</p>
                  <p className="text-xl font-semibold">${(activeLoan.loan_amount * 0.85).toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Repayment Progress</span>
                  <span className="text-sm text-gray-400">15% paid</span>
                </div>
                <Progress value={15} className="h-3" />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="bg-green-600 hover:bg-green-700 hover:shadow-lg hover:shadow-green-400/30">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Make Repayment
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-gray-600" onClick={() => setSelectedLoan(activeLoan)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </CardContent>
          </Card>}

        <div className="space-y-4">
          {filteredLoans.length === 0 ? <Card className="bg-[#111] border-gray-700">
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No loan applications found</p>
                <p className="text-gray-500 text-sm mt-2">
                  {filter !== 'All' ? `No ${filter.toLowerCase()} applications` : 'Apply for your first loan to get started'}
                </p>
              </CardContent>
            </Card> : filteredLoans.map(loan => <Card key={loan.id} className="bg-[#111] border-gray-700 hover:shadow-lg hover:shadow-green-400/10 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Loan Amount
                        </p>
                        <p className="text-xl font-bold">${loan.loan_amount.toLocaleString()}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-400 text-sm flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Duration
                        </p>
                        <p className="text-lg">{loan.duration_months} months</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-400 text-sm">Purpose</p>
                        <p className="text-sm truncate" title={loan.purpose}>{loan.purpose}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-400 text-sm">Submitted</p>
                        <p className="text-sm">{format(new Date(loan.created_at), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
                      <Badge className={`${statusColors[loan.status as keyof typeof statusColors] || statusColors['Pending Review']} border`}>
                        {loan.status}
                      </Badge>
                      
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-gray-600 hover:shadow-lg hover:shadow-blue-400/30" onClick={() => setSelectedLoan(loan)}>
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                        </Dialog>
                        
                        {loan.status === 'Pending Review' && <Button variant="outline" size="sm" className="border-red-600 text-red-400 hover:bg-red-600/10 hover:shadow-lg hover:shadow-red-400/30" onClick={() => cancelLoan(loan.id)}>
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>)}
        </div>

        {selectedLoan && <Dialog open={!!selectedLoan} onOpenChange={() => setSelectedLoan(null)}>
            <DialogContent className="bg-[#111] border-gray-700 max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">Loan Application Details</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-green-400 mb-3">Loan Information</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-gray-400 text-sm">Amount</p>
                        <p className="font-semibold">${selectedLoan.loan_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Duration</p>
                        <p>{selectedLoan.duration_months} months</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Status</p>
                        <Badge className={`${statusColors[selectedLoan.status as keyof typeof statusColors]} border mt-1`}>
                          {selectedLoan.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-green-400 mb-3">Personal Information</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-gray-400 text-sm">Owner Name</p>
                        <p>{selectedLoan.owner_name}</p>
                      </div>
                      {selectedLoan.business_name && <div>
                          <p className="text-gray-400 text-sm">Business Name</p>
                          <p>{selectedLoan.business_name}</p>
                        </div>}
                      <div>
                        <p className="text-gray-400 text-sm">Country</p>
                        <p>{selectedLoan.country}</p>
                      </div>
                      {selectedLoan.income_estimate && <div>
                          <p className="text-gray-400 text-sm">Income Estimate</p>
                          <p>${selectedLoan.income_estimate.toLocaleString()}</p>
                        </div>}
                    </div>
                  </div>
                </div>
                
                
                
                
                
                <div className="text-xs text-gray-500 pt-4 border-t border-gray-700">
                  <p>Application ID: {selectedLoan.id}</p>
                  <p>Submitted: {format(new Date(selectedLoan.created_at), 'MMMM dd, yyyy - HH:mm')}</p>
                  <p>Last Updated: {format(new Date(selectedLoan.updated_at), 'MMMM dd, yyyy - HH:mm')}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>}
      </div>
    </div>;
}