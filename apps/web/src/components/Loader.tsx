import { Icons } from '@/config/icons';
import React from 'react';

export default function Loader(props: any) {
  const { color } = props;
  return (
    <div className="w-full h-full flex justify-center items-center">
      <Icons.loader />
    </div>
  );
}
