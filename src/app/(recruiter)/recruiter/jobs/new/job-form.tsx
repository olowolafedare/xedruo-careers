'use client';

import { useState } from 'react';

type Company = {
  id: string;
  name: string;
};

export default function JobForm({
  companies,
}: {
  companies: Company[];
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setLoading(true);
    setMessage('');
    setError(false);

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/v1/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? 'Unable to create job.');
      }

      setMessage(`Draft created: ${result.job.title}`);
      form.reset();
    } catch (err) {
      setError(true);
      setMessage(
        err instanceof Error ? err.message : 'Something went wrong.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="company_id">Company</label>
      <select id="company_id" name="company_id" required>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>

      <label htmlFor="title">Job title</label>
      <input id="title" name="title" required maxLength={200} />

      <label htmlFor="description">Description</label>
      <textarea
        id="description"
        name="description"
        required
        rows={8}
      />

      <label htmlFor="location">Location</label>
      <input id="location" name="location" />

      <label htmlFor="type">Employment type</label>
      <select id="type" name="type" required>
        <option value="Full-time">Full-time</option>
        <option value="Part-time">Part-time</option>
        <option value="Contract">Contract</option>
        <option value="Internship">Internship</option>
        <option value="Remote">Remote</option>
      </select>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create draft'}
      </button>

      {message && (
        <p role="status" aria-live="polite" style={{ color: error ? 'crimson' : 'green' }}>
          {message}
        </p>
      )}
    </form>
  );
}
