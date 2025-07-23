
import React from 'react';

const Loader = ({ message }: { message: string }) => (
  <div className="text-center p-8 my-8 flex flex-col items-center justify-center space-y-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    <p className="text-lg text-gray-600 font-medium">{message}</p>
  </div>
);

export default Loader;
