import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Copee Extension",
  description: "Privacy Policy for Copee - Shopee Product Copier Chrome Extension",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy for Copee - Shopee Product Copier</h1>

        <p className="text-muted-foreground mb-8">
          <strong>Last Updated:</strong> December 31, 2025
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Overview</h2>
          <p>
            Copee - Shopee Product Copier ("the Extension") is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, and safeguard your information when you
            use our Chrome extension.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>

          <h3 className="text-xl font-semibold mb-3 mt-6">Data Collected by the Extension</h3>
          <p className="mb-4">The Extension collects and processes the following information:</p>

          <div className="mb-4">
            <h4 className="text-lg font-semibold mb-2">1. Product Information from Shopee</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li>Product titles, descriptions, prices, and images</li>
              <li>Product URLs and metadata</li>
              <li>This data is collected only when you actively use the extension to copy a product</li>
            </ul>
          </div>

          <div className="mb-4">
            <h4 className="text-lg font-semibold mb-2">2. User Settings</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your Copee web app API endpoint URL</li>
              <li>Extension preferences and settings</li>
              <li>This data is stored locally in your browser using Chrome&apos;s storage API</li>
            </ul>
          </div>

          <h3 className="text-xl font-semibold mb-3 mt-6">Authentication Data</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>The Extension connects to your Copee web app account (app.copee.vn or copee.local)</li>
            <li>Authentication is handled through your existing Copee account</li>
            <li>We do not store passwords or sensitive authentication credentials in the extension</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p className="mb-4">We use the collected information for the following purposes:</p>

          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">1. Core Functionality</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>To extract product information from Shopee pages</li>
              <li>To send product data to your Copee web app account</li>
              <li>To provide real-time status updates on product copying operations</li>
            </ul>
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">2. Settings Management</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>To remember your preferences and API endpoint configuration</li>
              <li>To maintain connection with your Copee account</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Storage</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>All settings and preferences are stored locally on your device using Chrome&apos;s <code>chrome.storage.local</code> API</li>
            <li>Product data is temporarily processed and immediately sent to your configured Copee web app</li>
            <li>We do not store product data permanently within the extension</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Sharing</h2>
          <p className="mb-4">
            We do not sell, trade, or transfer your personal information to third parties.
            Product data is sent only to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your configured Copee web app instance (app.copee.vn or your custom domain)</li>
            <li>The data transmission occurs over HTTPS encrypted connections</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Permissions Used</h2>
          <p className="mb-4">The Extension requires the following permissions:</p>

          <div className="space-y-4">
            <div>
              <strong>1. storage</strong> - To save your settings and preferences locally
            </div>
            <div>
              <strong>2. activeTab</strong> - To read product information from the current Shopee page
            </div>
            <div>
              <strong>3. scripting</strong> - To interact with Shopee pages and extract product data
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
          <p className="mb-4">The Extension interacts with:</p>

          <div className="space-y-3">
            <div>
              <strong>1. Shopee.vn</strong> - To extract publicly available product information
            </div>
            <div>
              <strong>2. Copee Web App</strong> - To send extracted data to your account
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p className="mb-4">We implement appropriate security measures to protect your information:</p>

          <ul className="list-disc pl-6 space-y-2">
            <li>HTTPS encryption for all data transmission</li>
            <li>Local storage of settings (not transmitted to external servers)</li>
            <li>No collection of personal browsing history outside of active extension use</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
          <p className="mb-4">You have the right to:</p>

          <ul className="list-disc pl-6 space-y-2">
            <li>Access your stored settings at any time</li>
            <li>Delete all extension data by uninstalling the extension</li>
            <li>Configure or change your Copee web app endpoint</li>
            <li>Disable the extension at any time</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Changes to Shopee&apos;s Website</h2>
          <p>
            The Extension extracts publicly available information from Shopee. We are not affiliated
            with Shopee and do not have control over changes to their website structure or policies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Children&apos;s Privacy</h2>
          <p>
            The Extension is not intended for users under the age of 13. We do not knowingly collect
            information from children under 13.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The updated version will be indicated
            by an updated &quot;Last Updated&quot; date at the top of this policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="mb-4">If you have questions about this Privacy Policy, please contact us at:</p>

          <ul className="list-disc pl-6 space-y-2">
            <li>Website: <a href="https://app.copee.vn" className="text-primary hover:underline">https://app.copee.vn</a></li>
            <li>Email: support@copee.vn</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Compliance</h2>
          <p className="mb-4">This Extension complies with:</p>

          <ul className="list-disc pl-6 space-y-2">
            <li>Chrome Web Store Developer Program Policies</li>
            <li>Google API Services User Data Policy</li>
            <li>Vietnamese data protection regulations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Consent</h2>
          <p>
            By using the Copee - Shopee Product Copier extension, you consent to this Privacy Policy
            and agree to its terms.
          </p>
        </section>
      </div>
    </div>
  );
}
