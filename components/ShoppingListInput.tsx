
import React from 'react';

interface ShoppingListInputProps {
  value: string;
  onChange: (val: string) => void;
}

const ShoppingListInput: React.FC<ShoppingListInputProps> = ({ value, onChange }) => {
  return (
    <div className="flex-1 flex flex-col min-h-[300px]">
      <textarea
        className="flex-1 w-full p-4 rounded-xl border border-zinc-800 focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 outline-none text-sm bg-zinc-950 text-zinc-200 transition-all font-mono placeholder:text-zinc-700 resize-none shadow-inner"
        placeholder="Bananas&#10;Milk&#10;Lindt Chocolate..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-3 flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
        <span>Shopping List (One item per line)</span>
        <span>{value.split('\n').filter(l => l.trim()).length} Items</span>
      </div>
    </div>
  );
};

export default ShoppingListInput;
