import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

/**
 * Pembaca Markdown companion `.md` dengan tabel (GFM) dan rumus KaTeX ($...$, $$...$$)
 * (Blueprint BAB IV modul 9, P2 audit Fase 4, LOG-032). Tidak merender HTML mentah (aman).
 */
export const MarkdownView: React.FC<{ source: string }> = ({ source }) => (
  <div className="md-body text-[13px] leading-relaxed text-[#0B1B33]">
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: (p) => <h3 className="font-heading font-bold text-base mt-4 mb-2" {...p} />,
        h2: (p) => <h4 className="font-heading font-bold text-sm mt-4 mb-2" {...p} />,
        h3: (p) => <h5 className="font-heading font-bold text-xs mt-3 mb-1.5" {...p} />,
        p: (p) => <p className="my-2" {...p} />,
        ul: (p) => <ul className="list-disc pl-5 my-2 space-y-1" {...p} />,
        ol: (p) => <ol className="list-decimal pl-5 my-2 space-y-1" {...p} />,
        blockquote: (p) => (
          <blockquote className="border-l-4 border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 my-2 rounded-r-xl" {...p} />
        ),
        a: (p) => <a className="text-[#0062CC] underline" target="_blank" rel="noreferrer" {...p} />,
        code: (p) => <code className="font-mono text-[12px] bg-[#EAF6FD] px-1 rounded" {...p} />,
        pre: (p) => <pre className="font-mono text-[12px] bg-[#F1F5F9] p-3 rounded-xl overflow-x-auto my-2" {...p} />,
        table: (p) => (
          <div className="overflow-x-auto my-3">
            <table className="w-full text-[12px] border-collapse min-w-[480px]" {...p} />
          </div>
        ),
        th: (p) => <th className="text-left font-semibold border-b border-[#C9DCEB] py-1.5 pr-3 align-top" {...p} />,
        td: (p) => <td className="border-b border-[#EAF6FD] py-1.5 pr-3 align-top" {...p} />,
      }}
    >
      {source}
    </ReactMarkdown>
  </div>
);
