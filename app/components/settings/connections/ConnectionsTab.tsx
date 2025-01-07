import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { logStore } from '~/lib/stores/logs';

interface GitHubUserResponse {
  username: string;
  id: number;
  [key: string]: any; // for other properties we don't explicitly need
}

export default function ConnectionsTab() {
  const [gitlabUsername, setGitlabUsername] = useState(Cookies.get('gitlabUsername') || '');
  const [gitlabToken, setGitlabToken] = useState(Cookies.get('gitlabToken') || '');
  const [isConnected, setIsConnected] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Check if credentials exist and verify them
    if (gitlabUsername && gitlabToken) {
      verifyGitHubCredentials();
    }
  }, []);

  const verifyGitHubCredentials = async () => {
    setIsVerifying(true);

    try {
      const response = await fetch('https://code.medtronic.com/api/v4/user', {
        headers: {
          Authorization: `Bearer ${gitlabToken}`,
        },
      });

      if (response.ok) {
        const data = (await response.json()) as GitHubUserResponse;

        if (data.username === gitlabUsername) {
          setIsConnected(true);
          return true;
        }
      }

      setIsConnected(false);

      return false;
    } catch (error) {
      console.error('Error verifying Git credentials:', error);
      setIsConnected(false);

      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveConnection = async () => {
    if (!gitlabUsername || !gitlabToken) {
      toast.error('Please provide both Git username and token');
      return;
    }

    setIsVerifying(true);

    const isValid = await verifyGitHubCredentials();

    if (isValid) {
      Cookies.set('gitlabUsername', gitlabUsername);
      Cookies.set('gitlabToken', gitlabToken);
      logStore.logSystem('GitHub connection settings updated', {
        username: gitlabUsername,
        hasToken: !!gitlabToken,
      });
      toast.success('Git credentials verified and saved successfully!');
      Cookies.set('git:gitlab.com', JSON.stringify({ username: gitlabToken, password: 'x-oauth-basic' }));
      setIsConnected(true);
    } else {
      toast.error('Invalid GitHub credentials. Please check your username and token.');
    }
  };

  const handleDisconnect = () => {
    Cookies.remove('gitlabUsername');
    Cookies.remove('gitlabToken');
    Cookies.remove('git:gitlab.com');
    setGitlabUsername('');
    setGitlabToken('');
    setIsConnected(false);
    logStore.logSystem('GitHub connection removed');
    toast.success('GitHub connection removed successfully!');
  };

  return (
    <div className="p-4 mb-4 border border-bolt-elements-borderColor rounded-lg bg-bolt-elements-background-depth-3">
      <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">Medtronic Git Connection</h3>
      <div className="flex mb-4">
        <div className="flex-1 mr-2">
          <label className="block text-sm text-bolt-elements-textSecondary mb-1">Medtronic Username:</label>
          <input
            type="text"
            value={gitlabUsername}
            onChange={(e) => setGitlabUsername(e.target.value)}
            disabled={isVerifying}
            className="w-full bg-white dark:bg-bolt-elements-background-depth-4 relative px-2 py-1.5 rounded-md focus:outline-none placeholder-bolt-elements-textTertiary text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary border border-bolt-elements-borderColor disabled:opacity-50"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-bolt-elements-textSecondary mb-1">Personal Access Token:</label>
          <input
            type="password"
            value={gitlabToken}
            onChange={(e) => setGitlabToken(e.target.value)}
            disabled={isVerifying}
            className="w-full bg-white dark:bg-bolt-elements-background-depth-4 relative px-2 py-1.5 rounded-md focus:outline-none placeholder-bolt-elements-textTertiary text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary border border-bolt-elements-borderColor disabled:opacity-50"
          />
        </div>
      </div>
      <div className="flex mb-4 items-center">
        {!isConnected ? (
          <button
            onClick={handleSaveConnection}
            disabled={isVerifying || !gitlabUsername || !gitlabToken}
            className="bg-bolt-elements-button-primary-background rounded-lg px-4 py-2 mr-2 transition-colors duration-200 hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isVerifying ? (
              <>
                <div className="i-ph:spinner animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              'Connect'
            )}
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="bg-bolt-elements-button-danger-background rounded-lg px-4 py-2 mr-2 transition-colors duration-200 hover:bg-bolt-elements-button-danger-backgroundHover text-bolt-elements-button-danger-text"
          >
            Disconnect
          </button>
        )}
        {isConnected && (
          <span className="text-sm text-green-600 flex items-center">
            <div className="i-ph:check-circle mr-1" />
            Connected to GitHub
          </span>
        )}
      </div>
    </div>
  );
}
