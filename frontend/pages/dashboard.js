import Head from 'next/head';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';

export default function DashboardLanding() {
  const { formatMessage } = useLanguage();
  return (
    <>
      <Head>
        <title>Dashboard - MGNREGA LokDekho</title>
      </Head>
      <Layout>
        <div className="container-safe py-10">
          <header className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              District Dashboards
            </h1>
            <p className="text-lg text-gray-600 mt-3">
              Explore district performance, employment, and works under MGNREGA.
            </p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="/" className="card p-6 hover-lift">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Quick Start
              </h3>
              <p className="text-gray-600 mb-4">
                Use your location or search for your district from the home page.
              </p>
              <span className="btn btn-primary">
                Go to Home
              </span>
            </a>

            <div className="card p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Key Metrics
              </h3>
              <ul className="text-gray-700 list-disc pl-5 space-y-1">
                <li>Households Registered</li>
                <li>Total Wages Paid</li>
                <li>Total Persondays</li>
                <li>Women Participation %</li>
              </ul>
            </div>

            <div className="card p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Tips
              </h3>
              <ul className="text-gray-700 list-disc pl-5 space-y-1">
                <li>Search by district or state name.</li>
                <li>Use Refresh Live Data to fetch the latest numbers.</li>
                <li>All cards support keyboard navigation and focus states.</li>
              </ul>
            </div>
          </section>
        </div>
      </Layout>
    </>
  );
}
