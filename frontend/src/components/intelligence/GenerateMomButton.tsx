import { FileText, Download } from 'lucide-react';

interface GenerateMomButtonProps {
    onClick: () => void;
    label?: string;
}

export const GenerateMomButton = ({ onClick, label = "Export MOM" }: GenerateMomButtonProps) => {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors border border-indigo-100"
            title="Generate formal Minutes of Meeting"
        >
            <FileText size={16} />
            <span>{label}</span>
            <Download size={14} className="ml-1 opacity-60" />
        </button>
    );
};
