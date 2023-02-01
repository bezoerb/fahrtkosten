import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { Form } from '../components/form';
import { Settings } from '../components/settings';
import { Result } from '../components/result';
import { useEffect, useState } from 'react';
import classNames from 'classnames';

const Home: NextPage = () => {
  const [settingOpen, setSettingsOpen] = useState(false);

  return (
    <div className={styles.container}>
      <Head>
        <title>Fahrtkosten</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className="text-3xl font-bold  text-left mb-12 w-full max-w-6xl mx-auto">Fahrtkosten</h1>
        <div
          className={classNames('z-10 absolute left-0 top-0 h-full p-8 transition-transform bg-white border shadow-md', {
            '-translate-x-full': !settingOpen,
            'translate-x-0': settingOpen,
          })}
        >
          <Settings className="grid  gap-8" />
          <button
            onClick={() => setSettingsOpen((value) => !value)}
            className="absolute right-0 top-4 translate-x-full px-4 py-3 border border-l-0 -ml-px bg-white"
          >
            Settings
          </button>
        </div>
        <div className="md:grid md:grid-cols-2 w-full h-full max-w-6xl mx-auto gap-8 ">
          <Form className="mb-8"/>
          <Result className="mt-6"/>
        </div>
      </main>

      <footer className={styles.footer}></footer>
    </div>
  );
};

export default Home;
