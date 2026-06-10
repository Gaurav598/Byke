import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { AlertCircle, MessageCircle, CheckCircle } from 'lucide-react';

interface SupportTicket {
  id: number;
  ticketId: string;
  category: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replies, setReplies] = useState<any[]>([]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/support/admin/all');
      setTickets(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (ticketId: string) => {
    try {
      const res = await api.get(`/support/${ticketId}/replies`);
      setReplies(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchReplies(selectedTicket.ticketId);
    }
  }, [selectedTicket]);

  const handleReply = async () => {
    if (!replyMessage || !selectedTicket) return;
    try {
      await api.post(`/support/${selectedTicket.ticketId}/reply`, { message: replyMessage });
      setReplyMessage('');
      fetchReplies(selectedTicket.ticketId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolve = async () => {
    if (!selectedTicket) return;
    try {
      await api.post(`/support/${selectedTicket.ticketId}/close`, { resolution: 'Resolved by Admin' });
      fetchTickets();
      setSelectedTicket(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Support Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mr-4" />
          <div>
            <p className="text-sm text-gray-500 font-medium">Open Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{tickets.filter(t => t.status === 'OPEN').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
          <CheckCircle className="w-10 h-10 text-green-500 mr-4" />
          <div>
            <p className="text-sm text-gray-500 font-medium">Resolved Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{tickets.filter(t => t.status === 'RESOLVED').length}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6 h-[600px]">
        {/* Ticket List */}
        <div className="w-1/3 bg-white rounded-lg shadow-sm border border-gray-200 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No tickets found.</div>
          ) : (
            tickets.map(ticket => (
              <div 
                key={ticket.id} 
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedTicket?.id === ticket.id ? 'bg-blue-50' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-bold text-gray-900">{ticket.ticketId}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${ticket.status === 'OPEN' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {ticket.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-800">{ticket.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{new Date(ticket.createdAt).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>

        {/* Ticket Details */}
        {selectedTicket ? (
          <div className="w-2/3 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedTicket.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">Ticket ID: {selectedTicket.ticketId} • Category: {selectedTicket.category}</p>
                </div>
                {selectedTicket.status !== 'RESOLVED' && (
                  <button onClick={handleResolve} className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition">
                    Mark Resolved
                  </button>
                )}
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
                {selectedTicket.description}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {replies.map(reply => (
                <div key={reply.id} className={`flex flex-col ${reply.senderType === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-lg text-sm ${reply.senderType === 'ADMIN' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    <p>{reply.message}</p>
                  </div>
                  <span className="text-xs text-gray-400 mt-1">{new Date(reply.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>

            {selectedTicket.status !== 'RESOLVED' && (
              <div className="p-4 border-t border-gray-200 flex gap-2">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                />
                <button onClick={handleReply} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-2/3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500">
            Select a ticket to view details
          </div>
        )}
      </div>
    </div>
  );
}
