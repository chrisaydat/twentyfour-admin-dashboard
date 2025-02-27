'use client';

import { useState, FormEvent } from 'react';
import { sendCustomerEmail } from './actions';

interface EmailDialogProps {
  customerName: string;
  customerEmail: string;
}

export function EmailDialog({ customerName, customerEmail }: EmailDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [subject, setSubject] = useState(`Hello ${customerName}`);
  const [message, setMessage] = useState(`Dear ${customerName},\n\nThank you for your recent order with us.\n\nBest regards,\nThe Team`);
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    if (!subject.trim()) {
      setStatusMessage('Subject is required');
      setIsError(true);
      return;
    }
    
    if (message.trim().length < 10) {
      setStatusMessage('Message must be at least 10 characters');
      setIsError(true);
      return;
    }
    
    try {
      setIsSending(true);
      setStatusMessage('');
      setIsError(false);
      
      const result = await sendCustomerEmail(customerEmail, subject, message);
      
      if (result.success) {
        setStatusMessage(result.message);
        setTimeout(() => {
          setIsOpen(false);
          setStatusMessage('');
        }, 1500);
      } else {
        setStatusMessage(result.message);
        setIsError(true);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setStatusMessage('There was an error sending the email.');
      setIsError(true);
    } finally {
      setIsSending(false);
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
      >
        📧 Email
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-md w-full mx-4 overflow-hidden">
        <div className="p-6">
          <div className="mb-5">
            <h3 className="text-lg font-medium">Send Email to {customerName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Send a message directly to {customerEmail}
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1" htmlFor="subject">
                  Subject
                </label>
                <input
                  id="subject"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  disabled={isSending}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Your message to the customer"
                  rows={8}
                  disabled={isSending}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Be concise and friendly.
                </p>
              </div>
              
              {statusMessage && (
                <div className={`p-3 rounded text-sm ${isError ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
                  {statusMessage}
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  disabled={isSending}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  disabled={isSending}
                >
                  {isSending ? "Sending..." : "Send Email"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 