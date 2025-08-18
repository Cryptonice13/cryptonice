import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle, DollarSign, Shield, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface LoanFormData {
  loanAmount: string;
  duration: string;
  interestType: string;
  collateralType: string;
  assetName: string;
  collateralValue: string;
}

const LoanApplication = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<LoanFormData>({
    loanAmount: '',
    duration: '',
    interestType: '',
    collateralType: '',
    assetName: '',
    collateralValue: ''
  });

  const totalSteps = 3;

  const handleInputChange = (field: keyof LoanFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.loanAmount && formData.duration && formData.interestType);
      case 2:
        return !!(formData.collateralType && formData.assetName && formData.collateralValue);
      case 3:
        return true; // Review step is always valid if we reached here
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitApplication = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to submit a loan application.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('loan_requests')
        .insert({
          user_id: user.id,
          loan_amount: parseFloat(formData.loanAmount),
          duration_months: parseInt(formData.duration),
          interest_type: formData.interestType,
          collateral_type: formData.collateralType,
          asset_name: formData.assetName,
          collateral_value: parseFloat(formData.collateralValue)
        });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Application Submitted",
        description: "Your loan application has been submitted successfully!",
      });
      
      // Reset form or redirect
      setFormData({
        loanAmount: '',
        duration: '',
        interestType: '',
        collateralType: '',
        assetName: '',
        collateralValue: ''
      });
      setCurrentStep(1);
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Loan Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="loanAmount">Loan Amount (USD)</Label>
          <Input
            id="loanAmount"
            type="number"
            placeholder="Enter loan amount"
            value={formData.loanAmount}
            onChange={(e) => handleInputChange('loanAmount', e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="duration">Duration (months)</Label>
          <Input
            id="duration"
            type="number"
            placeholder="Enter duration in months"
            value={formData.duration}
            onChange={(e) => handleInputChange('duration', e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="interestType">Interest Type</Label>
          <Select value={formData.interestType} onValueChange={(value) => handleInputChange('interestType', value)}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select interest type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed Rate</SelectItem>
              <SelectItem value="variable">Variable Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Collateral Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="collateralType">Collateral Type</Label>
          <Select value={formData.collateralType} onValueChange={(value) => handleInputChange('collateralType', value)}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select collateral type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="crypto">Cryptocurrency</SelectItem>
              <SelectItem value="nft">NFT</SelectItem>
              <SelectItem value="digital-asset">Other Digital Asset</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="assetName">Asset Name</Label>
          <Input
            id="assetName"
            placeholder="e.g., ETH, USDC, BAYC NFT"
            value={formData.assetName}
            onChange={(e) => handleInputChange('assetName', e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="collateralValue">Collateral Value (USD)</Label>
          <Input
            id="collateralValue"
            type="number"
            placeholder="Enter collateral value"
            value={formData.collateralValue}
            onChange={(e) => handleInputChange('collateralValue', e.target.value)}
            className="mt-2"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Review & Confirm
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-accent">
            <CardHeader>
              <CardTitle className="text-lg">Loan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">${parseFloat(formData.loanAmount || '0').toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{formData.duration} months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest Type:</span>
                <span className="font-medium capitalize">{formData.interestType.replace('-', ' ')}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent">
            <CardHeader>
              <CardTitle className="text-lg">Collateral Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium capitalize">{formData.collateralType.replace('-', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Asset:</span>
                <span className="font-medium">{formData.assetName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Value:</span>
                <span className="font-medium">${parseFloat(formData.collateralValue || '0').toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-accent/30 p-4 rounded-lg border border-accent">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="font-medium">Loan-to-Value Ratio: {formData.loanAmount && formData.collateralValue ? 
              ((parseFloat(formData.loanAmount) / parseFloat(formData.collateralValue)) * 100).toFixed(1) : 0}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <h1 className="text-3xl font-bold mb-2">Loan Application</h1>
            <p className="text-muted-foreground">Complete the form below to submit your loan application</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
              <span className="text-sm text-muted-foreground">
                {currentStep === 1 && "Loan Details"}
                {currentStep === 2 && "Collateral Info"}
                {currentStep === 3 && "Review & Confirm"}
              </span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          </div>

          {/* Form Content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={nextStep} className="flex items-center gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={submitApplication}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanApplication;