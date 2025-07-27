import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Upload, FileText, Building2, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface FormData {
  loanAmount: string;
  duration: string;
  purpose: string;
  businessName: string;
  ownerName: string;
  country: string;
  incomeEstimate: string;
  idProof: File | null;
  businessRegistration: File | null;
}

const BorrowerLoanApplication = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    loanAmount: '',
    duration: '',
    purpose: '',
    businessName: '',
    ownerName: '',
    country: '',
    incomeEstimate: '',
    idProof: null,
    businessRegistration: null,
  });

  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'India', 
    'Japan', 'Australia', 'Singapore', 'UAE', 'Other'
  ];

  const steps = [
    { number: 1, title: 'Loan Details', icon: DollarSign },
    { number: 2, title: 'Personal Info', icon: Building2 },
    { number: 3, title: 'Documents', icon: FileText },
    { number: 4, title: 'Review', icon: CheckCircle },
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: 'idProof' | 'businessRegistration', file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.loanAmount && formData.duration && formData.purpose);
      case 2:
        return !!(formData.ownerName && formData.country);
      case 3:
        return !!(formData.idProof);
      case 4:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitApplication = async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in to submit your application.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Mock file upload - in production, implement IPFS or proper file storage
      const idProofHash = formData.idProof ? `ipfs://mock-hash-${Date.now()}-id` : null;
      const businessRegHash = formData.businessRegistration ? `ipfs://mock-hash-${Date.now()}-business` : null;

      const { error } = await supabase
        .from('loan_requests')
        .insert({
          user_id: user.id,
          loan_amount: parseFloat(formData.loanAmount),
          duration_months: parseInt(formData.duration),
          purpose: formData.purpose,
          business_name: formData.businessName || null,
          owner_name: formData.ownerName,
          country: formData.country,
          income_estimate: formData.incomeEstimate ? parseFloat(formData.incomeEstimate) : null,
          id_proof_hash: idProofHash,
          business_registration_hash: businessRegHash,
          status: 'Pending Review'
        });

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "Your loan application has been submitted successfully.",
        variant: "default",
      });

      navigate('/home');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="loanAmount" className="text-muted-foreground">Loan Amount (USD)</Label>
        <Input
          id="loanAmount"
          type="number"
          placeholder="Enter amount"
          value={formData.loanAmount}
          onChange={(e) => handleInputChange('loanAmount', e.target.value)}
          className="mt-2 bg-background border-border"
        />
      </div>
      
      <div>
        <Label htmlFor="duration" className="text-muted-foreground">Duration (months)</Label>
        <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
          <SelectTrigger className="mt-2 bg-background border-border">
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 months</SelectItem>
            <SelectItem value="6">6 months</SelectItem>
            <SelectItem value="12">12 months</SelectItem>
            <SelectItem value="24">24 months</SelectItem>
            <SelectItem value="36">36 months</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="purpose" className="text-muted-foreground">Purpose of Loan</Label>
        <Textarea
          id="purpose"
          placeholder="Describe how you plan to use this loan"
          value={formData.purpose}
          onChange={(e) => handleInputChange('purpose', e.target.value)}
          className="mt-2 bg-background border-border min-h-[100px]"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="ownerName" className="text-muted-foreground">Owner Name *</Label>
        <Input
          id="ownerName"
          placeholder="Enter your full name"
          value={formData.ownerName}
          onChange={(e) => handleInputChange('ownerName', e.target.value)}
          className="mt-2 bg-background border-border"
        />
      </div>
      
      <div>
        <Label htmlFor="businessName" className="text-muted-foreground">Business Name (Optional)</Label>
        <Input
          id="businessName"
          placeholder="Enter business name"
          value={formData.businessName}
          onChange={(e) => handleInputChange('businessName', e.target.value)}
          className="mt-2 bg-background border-border"
        />
      </div>
      
      <div>
        <Label htmlFor="country" className="text-muted-foreground">Country *</Label>
        <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
          <SelectTrigger className="mt-2 bg-background border-border">
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country} value={country}>{country}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="incomeEstimate" className="text-muted-foreground">Annual Income Estimate (USD, Optional)</Label>
        <Input
          id="incomeEstimate"
          type="number"
          placeholder="Enter estimated annual income"
          value={formData.incomeEstimate}
          onChange={(e) => handleInputChange('incomeEstimate', e.target.value)}
          className="mt-2 bg-background border-border"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-muted-foreground">ID Proof *</Label>
        <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileChange('idProof', e.target.files?.[0] || null)}
            className="hidden"
            id="idProof"
          />
          <label htmlFor="idProof" className="cursor-pointer">
            <div className="text-sm text-muted-foreground">
              {formData.idProof ? (
                <span className="text-primary">✓ {formData.idProof.name}</span>
              ) : (
                <>Click to upload ID proof<br /><span className="text-xs">PDF, JPG, PNG up to 10MB</span></>
              )}
            </div>
          </label>
        </div>
      </div>
      
      <div>
        <Label className="text-muted-foreground">Business Registration (Optional)</Label>
        <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileChange('businessRegistration', e.target.files?.[0] || null)}
            className="hidden"
            id="businessReg"
          />
          <label htmlFor="businessReg" className="cursor-pointer">
            <div className="text-sm text-muted-foreground">
              {formData.businessRegistration ? (
                <span className="text-primary">✓ {formData.businessRegistration.name}</span>
              ) : (
                <>Click to upload business registration<br /><span className="text-xs">PDF, JPG, PNG up to 10MB</span></>
              )}
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Review Your Application</h3>
      
      <div className="grid gap-4">
        <Card className="p-4 bg-card border-border">
          <h4 className="font-medium text-foreground mb-2">Loan Details</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Amount: ${formData.loanAmount}</p>
            <p>Duration: {formData.duration} months</p>
            <p>Purpose: {formData.purpose}</p>
          </div>
        </Card>
        
        <Card className="p-4 bg-card border-border">
          <h4 className="font-medium text-foreground mb-2">Personal Information</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Name: {formData.ownerName}</p>
            {formData.businessName && <p>Business: {formData.businessName}</p>}
            <p>Country: {formData.country}</p>
            {formData.incomeEstimate && <p>Income: ${formData.incomeEstimate}</p>}
          </div>
        </Card>
        
        <Card className="p-4 bg-card border-border">
          <h4 className="font-medium text-foreground mb-2">Documents</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>ID Proof: {formData.idProof ? '✓ Uploaded' : '✗ Not uploaded'}</p>
            <p>Business Registration: {formData.businessRegistration ? '✓ Uploaded' : '✗ Not uploaded'}</p>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/home')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Loan Application</h1>
            <p className="text-muted-foreground">Step {currentStep} of 4</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                ${currentStep >= step.number 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : 'border-border text-muted-foreground'
                }
              `}>
                <step.icon className="h-5 w-5" />
              </div>
              <div className="ml-2 mr-6">
                <div className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mr-6 ${
                  currentStep > step.number ? 'bg-primary' : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <Card className="p-8 bg-card border-border rounded-xl shadow-lg hover:shadow-primary/20 transition-shadow">
          {renderStepContent()}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="border-border hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          {currentStep < 4 ? (
            <Button
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={submitApplication}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BorrowerLoanApplication;