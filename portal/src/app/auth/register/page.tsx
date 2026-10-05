'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/Toast';

export default function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  // Form Data State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    descType: 'rich-text', // 'rich-text' | 'file'
    companyDescription: '',
    industrySector: '',
    organizationType: '',
    postalAddress: '',
    website: '',
    contact1Name: '',
    contact1Email: '',
    contact1PhoneCode: '+91',
    contact1Phone: '',
    contact2Name: '',
    contact2Email: '',
    contact2PhoneCode: '+91',
    contact2Phone: '',
    agreedToPolicy: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (formData.password !== formData.confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }
      if (formData.password.length < 8) {
        setPasswordError('Password must be at least 8 characters');
        return;
      }
      setPasswordError('');
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleRegister = async () => {
    if (!formData.agreedToPolicy) {
      toast.warning('Please accept the placement policy to complete registration.');
      return;
    }

    try {
      const response = await fetch('/phdplacement/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          agreedToPolicy: formData.agreedToPolicy,
          company: {
            name: formData.companyName,
            description: formData.companyDescription,
            descriptionFile: formData.descType === 'file' ? 'placeholder_path' : '',
            industrySector: formData.industrySector,
            organizationType: formData.organizationType,
            postalAddress: formData.postalAddress,
            website: formData.website,
          },
          primaryContact: {
            fullName: formData.contact1Name,
            email: formData.contact1Email,
            contact: `${formData.contact1PhoneCode} ${formData.contact1Phone}`,
          },
          secondaryContact: {
            fullName: formData.contact2Name,
            email: formData.contact2Email,
            contact: `${formData.contact2PhoneCode} ${formData.contact2Phone}`,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Registration failed');
        return;
      }

      toast.success('Registration successful! Please log in.');
      router.push('/auth/login');
    } catch (error) {
      console.error('Error during registration:', error);
      toast.error('An error occurred during registration. Please try again.');
    }
  };

  const steps = [
    { id: 1, name: 'Login' },
    { id: 2, name: 'Company' },
    { id: 3, name: 'Contact' },
    { id: 4, name: 'Review' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative py-12">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat fixed"
        style={{ backgroundImage: 'url(/phdplacement/bg.jpeg)' }}
      >
        <div className="absolute inset-0 bg-[#5A6B62] opacity-40 mix-blend-multiply"></div>
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col my-8">
        <div className="p-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 flex items-center justify-center relative mb-4">
              <img src="/phdplacement/logo.jpeg" alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 text-center mb-8">Recruiter Registration</h1>

          {/* Stepper */}
          <div className="flex justify-center mb-10">
            <div className="flex items-center space-x-3 md:space-x-5">
              {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex items-center space-x-2">
                      <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold
                        ${isActive || isCompleted ? 'bg-[#0f172a] text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {isCompleted ? '✓' : step.id}
                      </div>
                      <span className={`text-xs ${isActive || isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                        {step.name}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-4 md:w-6 h-[1px] bg-gray-200 mx-3 md:mx-5"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="mt-8">
            {currentStep === 1 && (
              <div className="space-y-6 max-w-[480px] mx-auto">
                <div>
                  <label className="block text-xs text-gray-800 mb-2">
                    Email ID
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a] text-sm text-gray-800 placeholder-gray-300"
                    placeholder="Enter Email ID"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-800 mb-2">
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full p-2.5 pr-10 bg-white border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a] text-sm text-gray-800 placeholder-gray-300"
                      placeholder="Enter Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 hover:text-gray-500"
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-800 mb-2">
                    Re-enter Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full p-2.5 pr-10 bg-white border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a] text-sm text-gray-800 placeholder-gray-300"
                      placeholder="Enter Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 hover:text-gray-500"
                    >
                      {showConfirmPassword ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      )}
                    </button>
                  </div>
                  {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={nextStep} className="bg-[#0f172a] text-white px-5 py-2 rounded-sm text-sm font-medium hover:bg-black transition-colors">
                    Next
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 max-w-[480px] mx-auto">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-2">Company Name <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.companyName} onChange={e => handleInputChange('companyName', e.target.value)} className="w-full p-2.5 bg-white border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a] text-sm text-gray-800 placeholder-gray-300" placeholder="Enter Company Name" />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-3">Company Description</label>
                  
                  {/* Rich Text Option */}
                  <div className="flex items-start mb-4">
                    <div className="pt-2 mr-3">
                      <input type="radio" checked={formData.descType === 'rich-text'} onChange={() => handleInputChange('descType', 'rich-text')} className="w-4 h-4 text-[#0f172a] focus:ring-[#0f172a]" />
                    </div>
                    <div className={`flex-1 border ${formData.descType === 'rich-text' ? 'border-[#0f172a]' : 'border-gray-200'} rounded-sm overflow-hidden transition-colors`}>
                      <div className="border-b border-gray-200 p-1 flex gap-1 bg-white">
                        <button className="p-1 px-2 text-gray-800 hover:bg-gray-100 rounded-sm font-bold text-sm">B</button>
                        <button className="p-1 px-2 text-gray-800 hover:bg-gray-100 rounded-sm italic text-sm">I</button>
                        <button className="p-1 px-2 text-gray-800 hover:bg-gray-100 rounded-sm underline text-sm">U</button>
                        <button className="p-1 px-2 text-gray-800 hover:bg-gray-100 rounded-sm flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </button>
                      </div>
                      <textarea rows={4} value={formData.companyDescription} onChange={e => handleInputChange('companyDescription', e.target.value)} className="w-full p-3 text-sm text-gray-800 focus:outline-none focus:ring-0 resize-none placeholder-gray-300" placeholder="Enter Company Description"></textarea>
                    </div>
                  </div>

                  <div className="text-center text-xs font-bold text-gray-500 my-2 uppercase">OR</div>

                  {/* File Upload Option */}
                  <div className="flex items-start">
                    <div className="pt-1 mr-3">
                      <input type="radio" checked={formData.descType === 'file'} onChange={() => handleInputChange('descType', 'file')} className="w-4 h-4 text-[#0f172a] focus:ring-[#0f172a]" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-800 font-medium mb-2">Upload File <span className="text-gray-400 font-normal">(File size Limit : 10MB)</span></div>
                      <input type="file" className="hidden" id="file-upload" />
                      <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 py-1.5 px-4 rounded-sm text-xs hover:bg-gray-100 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        Upload
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-2">Industry Sector <span className="text-red-500">*</span></label>
                    <select value={formData.industrySector} onChange={e => handleInputChange('industrySector', e.target.value)} className="w-full p-2.5 bg-white border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a] text-sm text-gray-800">
                      <option value="" disabled>Select</option>
                      <option value="Computer Software">Computer Software</option>
                      <option value="IT Services">IT Services</option>
                      <option value="Finance">Finance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-2">Organization Type <span className="text-red-500">*</span></label>
                    <select value={formData.organizationType} onChange={e => handleInputChange('organizationType', e.target.value)} className="w-full p-2.5 bg-white border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a] text-sm text-gray-800">
                      <option value="" disabled>Select</option>
                      <option value="Private">Private</option>
                      <option value="Public">Public</option>
                      <option value="Government">Government</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-2">Postal Address <span className="text-red-500">*</span></label>
                  <textarea rows={3} value={formData.postalAddress} onChange={e => handleInputChange('postalAddress', e.target.value)} className="w-full p-2.5 bg-white border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a] text-sm text-gray-800 resize-none"></textarea>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-2">Website <span className="text-red-500">*</span></label>
                  <input type="url" value={formData.website} onChange={e => handleInputChange('website', e.target.value)} className="w-full p-2.5 bg-white border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a] text-sm text-gray-800" />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button onClick={prevStep} className="text-red-700 text-xs font-semibold hover:underline">Previous Step</button>
                  <button onClick={nextStep} className="bg-[#0f172a] text-white px-5 py-2 rounded-sm text-sm font-medium hover:bg-black transition-colors">Save and Next</button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 max-w-[480px] mx-auto">
                <div>
                  <h3 className="text-[#159a80] text-sm font-semibold mb-3">1 Point of Contact</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 mb-2">Full Name <span className="text-red-500">*</span></label>
                      <input type="text" value={formData.contact1Name} onChange={e => handleInputChange('contact1Name', e.target.value)} className="w-full p-2.5 bg-white border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a] text-sm text-gray-800 placeholder-gray-300" placeholder="Enter Full Name" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 mb-2">Email ID <span className="text-red-500">*</span></label>
                      <input type="email" value={formData.contact1Email} onChange={e => handleInputChange('contact1Email', e.target.value)} className="w-full p-2.5 bg-white border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a] text-sm text-gray-800 placeholder-gray-300" placeholder="Enter email ID" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 mb-2">Contact No. <span className="text-red-500">*</span></label>
                      <div className="flex">
                        <select value={formData.contact1PhoneCode} onChange={e => handleInputChange('contact1PhoneCode', e.target.value)} className="w-[70px] p-2.5 border border-r-0 border-gray-200 rounded-l-sm bg-white focus:outline-none text-xs text-gray-800">
                          <option value="+91">+91</option>
                          <option value="+1">+1</option>
                          <option value="+44">+44</option>
                        </select>
                        <input type="tel" value={formData.contact1Phone} onChange={e => handleInputChange('contact1Phone', e.target.value)} className="flex-1 p-2.5 border border-gray-200 rounded-r-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a] text-sm text-gray-800 placeholder-gray-300" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[#159a80] text-sm font-semibold mb-3">2 Point of Contact (Preferably Head HR)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 mb-2">Full Name <span className="text-red-500">*</span></label>
                      <input type="text" value={formData.contact2Name} onChange={e => handleInputChange('contact2Name', e.target.value)} className="w-full p-2.5 bg-white border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a] text-sm text-gray-800 placeholder-gray-300" placeholder="Enter Full Name" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 mb-2">Email ID <span className="text-red-500">*</span></label>
                      <input type="email" value={formData.contact2Email} onChange={e => handleInputChange('contact2Email', e.target.value)} className="w-full p-2.5 bg-white border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a] text-sm text-gray-800 placeholder-gray-300" placeholder="Enter email ID" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 mb-2">Contact No. <span className="text-red-500">*</span></label>
                      <div className="flex">
                        <select value={formData.contact2PhoneCode} onChange={e => handleInputChange('contact2PhoneCode', e.target.value)} className="w-[70px] p-2.5 border border-r-0 border-gray-200 rounded-l-sm bg-white focus:outline-none text-xs text-gray-800">
                          <option value="+91">+91</option>
                          <option value="+1">+1</option>
                          <option value="+44">+44</option>
                        </select>
                        <input type="tel" value={formData.contact2Phone} onChange={e => handleInputChange('contact2Phone', e.target.value)} className="flex-1 p-2.5 border border-gray-200 rounded-r-sm focus:outline-none focus:ring-1 focus:ring-[#0f172a] text-sm text-gray-800 placeholder-gray-300" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button onClick={prevStep} className="text-red-700 text-xs font-semibold hover:underline">Previous Step</button>
                  <button onClick={nextStep} className="bg-[#0f172a] text-white px-5 py-2 rounded-sm text-sm font-medium hover:bg-black transition-colors">Go to Preview</button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6 max-w-[500px] mx-auto">
                <div className="border border-gray-100 rounded-sm overflow-hidden text-xs">
                  <div className="grid grid-cols-3 border-b border-gray-100">
                    <div className="p-3 text-gray-500">Company Name</div>
                    <div className="col-span-2 p-3 text-gray-800">{formData.companyName || '-'}</div>
                  </div>
                  <div className="grid grid-cols-3 border-b border-gray-100">
                    <div className="p-3 text-gray-500">Company Description</div>
                    <div className="col-span-2 p-3 text-gray-800">{formData.companyDescription || (formData.descType === 'file' ? 'File Uploaded' : '-')}</div>
                  </div>
                  <div className="grid grid-cols-3 border-b border-gray-100">
                    <div className="p-3 text-gray-500">Industry Sector</div>
                    <div className="col-span-2 p-3 text-gray-800">{formData.industrySector || '-'}</div>
                  </div>
                  <div className="grid grid-cols-3 border-b border-gray-100">
                    <div className="p-3 text-gray-500">Organization Type</div>
                    <div className="col-span-2 p-3 text-gray-800">{formData.organizationType || '-'}</div>
                  </div>
                  <div className="grid grid-cols-3">
                    <div className="p-3 text-gray-500">Postal Address</div>
                    <div className="col-span-2 p-3 text-gray-800">{formData.postalAddress || '-'}</div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 px-1">
                    <h3 className="text-xs font-bold text-gray-800">1st Point of Contact</h3>
                    <button onClick={() => setCurrentStep(3)} className="text-blue-600 text-[10px] hover:underline font-medium">Edit</button>
                  </div>
                  <div className="border border-gray-100 rounded-sm overflow-hidden text-xs">
                    <div className="grid grid-cols-3 border-b border-gray-100">
                      <div className="p-3 text-gray-500">Full Name</div>
                      <div className="col-span-2 p-3 text-gray-800">{formData.contact1Name || '-'}</div>
                    </div>
                    <div className="grid grid-cols-3 border-b border-gray-100">
                      <div className="p-3 text-gray-500">Email ID</div>
                      <div className="col-span-2 p-3 text-gray-800">{formData.contact1Email || '-'}</div>
                    </div>
                    <div className="grid grid-cols-3">
                      <div className="p-3 text-gray-500">Contact No</div>
                      <div className="col-span-2 p-3 text-gray-800">{formData.contact1PhoneCode} {formData.contact1Phone || '-'}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 px-1">
                    <h3 className="text-xs font-bold text-gray-800">2nd Point of Contact (Preferably Head HR)</h3>
                  </div>
                  <div className="border border-gray-100 rounded-sm overflow-hidden text-xs">
                    <div className="grid grid-cols-3 border-b border-gray-100">
                      <div className="p-3 text-gray-500">Full Name</div>
                      <div className="col-span-2 p-3 text-gray-800">{formData.contact2Name || '-'}</div>
                    </div>
                    <div className="grid grid-cols-3 border-b border-gray-100">
                      <div className="p-3 text-gray-500">Email ID</div>
                      <div className="col-span-2 p-3 text-gray-800">{formData.contact2Email || '-'}</div>
                    </div>
                    <div className="grid grid-cols-3">
                      <div className="p-3 text-gray-500">Contact No</div>
                      <div className="col-span-2 p-3 text-gray-800">{formData.contact2PhoneCode} {formData.contact2Phone || '-'}</div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-gray-800 leading-relaxed px-1">
                  If the information shown above is correct, click on the button below to complete your registration. You will receive a confirmation regarding your registration on your email soon.
                </div>

                <div className="flex items-start px-1">
                  <div className="flex items-center h-4 mt-0.5 mr-2">
                    <input id="policy" type="checkbox" checked={formData.agreedToPolicy} onChange={e => handleInputChange('agreedToPolicy', e.target.checked)} className="w-3.5 h-3.5 border border-gray-300 rounded-sm bg-white focus:ring-1 focus:ring-[#0f172a] text-[#0f172a] cursor-pointer accent-[#0f172a]" />
                  </div>
                  <label htmlFor="policy" className="text-[11px] text-gray-800 cursor-pointer">
                    I hereby confirm I have read and I agree to the Internship Policy of IIT Guwahati. Click <a href="#" className="text-blue-600 hover:underline">here</a> to read the Internship policy
                  </label>
                </div>

                <div>
                  <button 
                    onClick={handleRegister} 
                    disabled={!formData.agreedToPolicy}
                    className={`w-full py-2.5 rounded-sm font-semibold transition-colors text-sm ${formData.agreedToPolicy ? 'bg-[#1e2741] text-white hover:bg-[#0f172a]' : 'bg-[#1e2741]/80 text-white cursor-not-allowed'}`}
                  >
                    Register as new recruiter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
