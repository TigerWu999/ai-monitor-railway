import AICameraGrid from '@/components/AICameraGrid';

export const metadata = {
  title: 'AI Monitor System',
  description: 'AI-powered monitoring and analytics',
};

export default function AIMonitorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">AI Monitor System</h1>
          <p className="text-gray-600 mt-2">Real-time AI-powered surveillance and analytics</p>
        </div>

        <AICameraGrid />
      </div>
    </div>
  );
}
