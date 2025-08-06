export default function CyberXBinance03Details() {
  return (
    <div className="w-full p-4">
      <div className="bg-gray-50 shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">CyberX 币安 03 - Detailed View</h1>
        <p className="text-gray-600 mb-4">This is the detailed view for CyberX 币安 03 portfolio.</p>
        
        {/* Add your detailed content here */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-md border">
            <h2 className="text-lg font-semibold mb-2">Portfolio Details</h2>
            <p>Detailed portfolio information will go here...</p>
          </div>
          
          <div className="bg-white p-4 rounded-md border">
            <h2 className="text-lg font-semibold mb-2">Performance Metrics</h2>
            <p>Detailed performance metrics will go here...</p>
          </div>
          
          <div className="bg-white p-4 rounded-md border">
            <h2 className="text-lg font-semibold mb-2">Risk Analysis</h2>
            <p>Detailed risk analysis will go here...</p>
          </div>
        </div>
        
        <div className="mt-6">
          <a 
            href="/" 
            className="text-blue-500 hover:underline"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
} 