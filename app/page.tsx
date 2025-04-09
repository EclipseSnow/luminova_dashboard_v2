import PositionsList from './components/PositionsList';

export const revalidate = 10; // Revalidate every 10 seconds

export default async function Home() {
  try {
    const currentDateTime = new Date().toLocaleString(); // Get current date and time

    return (
      <main className="min-h-screen p-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Binance Wallet Balances
        </h1>
        <p className="text-center mb-4">{`Current Date and Time: ${currentDateTime}`}</p>
        <PositionsList />
      </main>
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const currentDateTime = new Date().toLocaleString(); // Get current date and time

    return (
      <main className="min-h-screen p-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Bybit Wallet Balances
        </h1>
        <p className="text-center mb-4">{`Current Date and Time: ${currentDateTime}`}</p> {/* Display current date and time */}
        <div className="w-full max-w-4xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading data: {errorMessage}</p>
        </div>
      </main>
    );
  }
}
