
import React, { useState } from 'react';
import type { BusStop, UserDetails } from '../types';

interface LoginPageProps {
  onLogin: (details: UserDetails) => void;
  busStops: BusStop[];
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, busStops }) => {
  const [rollNumber, setRollNumber] = useState('');
  const [boardingStopName, setBoardingStopName] = useState(busStops[0]?.name || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber.trim()) {
      setError('Please enter your roll number.');
      return;
    }
    if (!boardingStopName) {
      setError('Please select a boarding stop.');
      return;
    }
    setError('');
    onLogin({ rollNumber, boardingStopName });
  };

  return (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800">Bus Tracker</h1>
          <p className="mt-2 text-gray-600">MVGR College of Engineering</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="rollNumber" className="text-sm font-bold text-gray-600 tracking-wide">
              Roll Number
            </label>
            <input
              id="rollNumber"
              name="rollNumber"
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              className="w-full content-center text-base py-2 border-b border-gray-300 focus:outline-none focus:border-indigo-500"
              placeholder="Enter your roll number"
            />
          </div>
          <div>
            <label htmlFor="boardingStop" className="text-sm font-bold text-gray-600 tracking-wide">
              Boarding Stop
            </label>
            <select
              id="boardingStop"
              name="boardingStop"
              value={boardingStopName}
              onChange={(e) => setBoardingStopName(e.target.value)}
              className="w-full content-center text-base py-2 border-b border-gray-300 focus:outline-none focus:border-indigo-500"
            >
              {busStops.map((stop) => (
                <option key={stop.name} value={stop.name}>
                  {stop.name}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full flex justify-center bg-indigo-500 text-gray-100 p-4 rounded-full tracking-wide font-semibold focus:outline-none focus:shadow-outline hover:bg-indigo-600 shadow-lg cursor-pointer transition ease-in duration-300"
            >
              Track Bus
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
