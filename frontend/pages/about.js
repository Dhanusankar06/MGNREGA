import Head from 'next/head';
import { useIntl } from 'react-intl';
import Layout from '../components/Layout';

export default function About() {
  const intl = useIntl();
  return (
    <>
      <Head>
        <title>{intl.formatMessage({ id: 'nav.about', defaultMessage: 'About' })} - MGNREGA LokDekho</title>
      </Head>
      <Layout>
        <div className="container-safe py-10">
          <header className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              {intl.formatMessage({ id: 'about.title', defaultMessage: 'About MGNREGA LokDekho' })}
            </h1>
            <p className="text-lg text-gray-600 mt-3 max-w-3xl mx-auto">
              {intl.formatMessage({ id: 'about.subtitle', defaultMessage: 'A public information portal to help citizens view MGNREGA performance for their districts with accessible, multilingual data.' })}
            </p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{intl.formatMessage({ id: 'about.mission', defaultMessage: 'Mission' })}</h3>
              <p className="text-gray-700">
                {intl.formatMessage({ id: 'about.mission.text', defaultMessage: 'Empower citizens with transparent and timely access to MGNREGA data through a simple, mobile-friendly interface.' })}
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{intl.formatMessage({ id: 'about.data', defaultMessage: 'Data Source' })}</h3>
              <p className="text-gray-700">
                {intl.formatMessage({ id: 'about.data.text', defaultMessage: 'The dashboard aggregates information from government public datasets and surfaces key indicators at the district level.' })}
              </p>
            </div>
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{intl.formatMessage({ id: 'about.accessibility', defaultMessage: 'Accessibility' })}</h3>
              <p className="text-gray-700">
                {intl.formatMessage({ id: 'about.accessibility.text', defaultMessage: 'Designed with WCAG-compliant colors, clear labels, keyboard support, and multiple languages.' })}
              </p>
            </div>
          </section>

          <section className="card p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{intl.formatMessage({ id: 'about.contact', defaultMessage: 'Contact' })}</h3>
            <p className="text-gray-700 mb-4">{intl.formatMessage({ id: 'about.contact.text', defaultMessage: 'For feedback or support, please reach out through the official channels of the Ministry of Rural Development.' })}</p>
            <a href="/" className="btn btn-secondary">{intl.formatMessage({ id: 'about.back_home', defaultMessage: 'Back to Home' })}</a>
          </section>
        </div>
      </Layout>
    </>
  );
}
