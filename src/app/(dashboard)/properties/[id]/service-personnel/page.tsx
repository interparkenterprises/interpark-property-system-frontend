'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import PropertyServicePersonnelManager from '@/components/service-personnel/PropertyServicePersonnelManager';
import { propertiesAPI } from '@/lib/api';

export default function PropertyServicePersonnelPage() {
  const params = useParams<{ id: string }>();
  const propertyId = params.id;
  const [propertyName, setPropertyName] = useState('Property');

  useEffect(() => {
    let active = true;
    propertiesAPI.getById(propertyId)
      .then(property => { if (active) setPropertyName(property.name); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [propertyId]);

  return (
    <div className="space-y-5">
      <Link href={`/properties/${propertyId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to property
      </Link>
      <PropertyServicePersonnelManager propertyId={propertyId} propertyName={propertyName} />
    </div>
  );
}
