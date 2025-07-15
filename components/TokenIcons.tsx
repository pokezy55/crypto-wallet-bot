import React from 'react';

interface TokenIconProps {
  className?: string;
}

export const Eth: React.FC<TokenIconProps> = ({ className = "w-6 h-6" }) => (
  <img 
    src="https://www.citypng.com/public/uploads/preview/ethereum-eth-round-logo-icon-png-701751694969815akblwl2552.png" 
    alt="ETH" 
    className={`${className} rounded-full`}
    style={{ objectFit: 'cover' }}
  />
  );

export const Usdt: React.FC<TokenIconProps> = ({ className = "w-6 h-6" }) => (
  <img 
    src="https://cdn.worldvectorlogo.com/logos/tether-1.svg" 
    alt="USDT" 
    className={`${className} rounded-full`}
    style={{ objectFit: 'cover' }}
  />
  );

export const Bnb: React.FC<TokenIconProps> = ({ className = "w-6 h-6" }) => (
  <img 
    src="https://images.seeklogo.com/logo-png/47/2/bnb-bnb-logo-png_seeklogo-476074.png" 
    alt="BNB" 
    className={`${className} rounded-full`}
    style={{ objectFit: 'cover' }}
  />
  );

export const Pol: React.FC<TokenIconProps> = ({ className = "w-6 h-6" }) => (
  <img 
    src="https://images.seeklogo.com/logo-png/48/1/polygon-matic-logo-png_seeklogo-482146.png" 
    alt="POL" 
    className={`${className} rounded-full`}
    style={{ objectFit: 'cover' }}
  />
);

export const Base: React.FC<TokenIconProps> = ({ className = "w-6 h-6" }) => (
  <img 
    src="https://www.citypng.com/public/uploads/preview/ethereum-eth-round-logo-icon-png-701751694969815akblwl2552.png" 
    alt="BASE" 
    className={`${className} rounded-full`}
    style={{ objectFit: 'cover' }}
  />
); 