import Head from 'next/head';
import { useIntl } from 'react-intl';
import Layout from '../components/Layout';

export default function DashboardLanding() {
  const intl = useIntl();
  return (
    <>
      <Head>
        <title>{intl.formatMessage({ id: 'nav.dashboard', defaultMessage: 'Dashboard' })} - MGNREGA LokDekho</title>
      </Head>
      <Layout>
        <div className="container-safe py-10">
          <header className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              {intl.formatMessage({ id: 'dashboard.heading', defaultMessage: 'District Dashboards' })}
            </h1>
            <p className="text-lg text-gray-600 mt-3">
              {intl.formatMessage({ id: 'dashboard.landing.subtitle', defaultMessage: 'Explore district performance, employment, and works under MGNREGA.' })}
            </p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="/" className="card p-6 hover-lift">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {intl.formatMessage({ id: 'dashboard.quick.start', defaultMessage: 'Quick Start' })}
              </h3>
              <p className="text-gray-600 mb-4">
                {intl.formatMessage({ id: 'dashboard.quick.start.desc', defaultMessage: 'Use your location or search for your district from the home page.' })}
              </p>
              <span className="btn btn-primary">
                {intl.formatMessage({ id: 'dashboard.go_home', defaultMessage: 'Go to Home' })}
              </span>
            </a>

            <div className="card p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {intl.formatMessage({ id: 'dashboard.metrics', defaultMessage: 'Key Metrics' })}
              </h3>
              <ul className="text-gray-700 list-disc pl-5 space-y-1">
                <li>{intl.formatMessage({ id: 'metrics.households', defaultMessage: 'Households Registered' })}</li>
                <li>{intl.formatMessage({ id: 'metrics.wages', defaultMessage: 'Total Wages Paid' })}</li>
                <li>{intl.formatMessage({ id: 'metrics.persondays', defaultMessage: 'Total Persondays' })}</li>
                <li>{intl.formatMessage({ id: 'metrics.women', defaultMessage: 'Women Participation %' })}</li>
              </ul>
            </div>

            <div className="card p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {intl.formatMessage({ id: 'dashboard.tips', defaultMessage: 'Tips' })}
              </h3>
              <ul className="text-gray-700 list-disc pl-5 space-y-1">
                <li>{intl.formatMessage({ id: 'dashboard.tip.search', defaultMessage: 'Search by district or state name.' })}</li>
                <li>{intl.formatMessage({ id: 'dashboard.tip.refresh', defaultMessage: 'Use Refresh Live Data to fetch the latest numbers.' })}</li>
                <li>{intl.formatMessage({ id: 'dashboard.tip.accessibility', defaultMessage: 'All cards support keyboard navigation and focus states.' })}</li>
              </ul>
            </div>
          </section>
        </div>
      </Layout>
    </>
  );
}
