import React, { useState, useRef, useEffect } from 'react';
import { Download, User, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

// Configuração inicial das imagens da proposta
const GrapeLogo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center p-1.5">
      <svg viewBox="0 0 24 24" className="w-full h-full fill-[#4a0080]">
        <path d="M12,2C11.45,2,11,2.45,11,3v1.1c-3.37,0.46-6,3.35-6,6.9c0,3.87,3.13,7,7,7s7-3.13,7-7c0-3.55-2.63-6.44-6-6.9V3 C13,2.45,12.55,2,12,2z" />
      </svg>
    </div>
    <span className="font-black text-2xl text-white tracking-tighter">GRAPE</span>
  </div>
);

// Componente para as páginas da proposta
const ProposalPage: React.FC<{ 
  children?: React.ReactNode, 
  pageNumber: number, 
  status?: 'loading' | 'success' | 'error',
  onStatusChange: (status: 'success' | 'error') => void,
  hideStatus?: boolean
}> = ({ children, pageNumber, status, onStatusChange, hideStatus }) => {
  const bgImage = `/imagens/${pageNumber}.png`;

  return (
    <div 
      className="proposal-page relative bg-black flex-shrink-0 overflow-hidden"
      style={{ 
        width: '1122.5px', 
        height: '631.4px',
      }}
    >
      {/* Status Badge */}
      {!hideStatus && (
        <div className={`absolute top-4 right-4 px-2 py-1 rounded text-[8px] font-bold text-white uppercase tracking-widest z-20 ${
          status === 'success' ? 'bg-green-500/80' : 
          status === 'error' ? 'bg-red-500/80' : 
          'bg-blue-500/80 animate-pulse'
        }`}>
          {status === 'loading' ? 'Carregando...' : status === 'success' ? 'Página OK' : 'Erro de Carregamento'}
        </div>
      )}

      <img 
        src={bgImage} 
        className="absolute inset-0 w-full h-full object-cover" 
        alt={`Página ${pageNumber}`}
        referrerPolicy="no-referrer"
        onLoad={() => onStatusChange('success')}
        onError={() => onStatusChange('error')}
      />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4a0080]"></div>
        </div>
      )}
      <div className="relative z-10 w-full h-full">
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] z-30">
            <div className="bg-red-500 text-white text-[12px] font-black px-4 py-2 rounded-full shadow-2xl animate-bounce flex items-center gap-2">
              <AlertCircle size={16} />
              ERRO: IMAGEM {pageNumber}.png NÃO ENCONTRADA
            </div>
            <p className="text-white/80 text-[10px] mt-2 font-bold uppercase tracking-widest bg-black/60 px-3 py-1 rounded">
              Verifique se o arquivo está na pasta /public/imagens/
            </p>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default function App() {
  const [clientName, setClientName] = useState('');
  const [proposalDate, setProposalDate] = useState(new Date().toLocaleDateString('pt-BR'));
  const [pricing, setPricing] = useState({
    withVoucher: "8.500",
    withoutVoucher: "10.000",
    entryWithVoucher: "3.400",
    entryWithoutVoucher: "4.000",
    installmentWithVoucher: "1.700",
    installmentWithoutVoucher: "2.000",
    economy: "1.500"
  });
  const [isExporting, setIsExporting] = useState(false);
  const [imageStatus, setImageStatus] = useState<Record<number, 'loading' | 'success' | 'error'>>({});
  const [isReady, setIsReady] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.7);
  const proposalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsReady(true);
    checkAllImages();
  }, []);

  const handleStatusChange = (page: number, status: 'success' | 'error') => {
    setImageStatus(prev => ({ ...prev, [page]: status }));
  };

  const checkAllImages = () => {
    const initialStatus: Record<number, 'loading' | 'success' | 'error'> = {};
    for (let i = 1; i <= 15; i++) {
      initialStatus[i] = 'loading';
    }
    setImageStatus(initialStatus);

    for (let i = 1; i <= 15; i++) {
      const img = new Image();
      img.src = `/imagens/${i}.png`;
      img.onload = () => {
        setImageStatus(prev => ({ ...prev, [i]: 'success' }));
      };
      img.onerror = () => {
        setImageStatus(prev => ({ ...prev, [i]: 'error' }));
      };
    }
  };

  const handleExportPDF = async () => {
    if (!proposalRef.current) return;
    
    // @ts-ignore
    if (typeof html2pdf === 'undefined') {
      alert("O gerador de PDF ainda está carregando. Por favor, aguarde alguns segundos e tente novamente.");
      return;
    }

    setIsExporting(true);

    try {
      const element = proposalRef.current;
      const pages = Array.from(element.querySelectorAll('.proposal-page'));
      let pagesHtml = '';
      
      pages.forEach((page, index) => {
        const htmlPage = page as HTMLElement;
        
        // Extract the image src from the <img> tag
        const imgElement = htmlPage.querySelector('img');
        const imgSrc = imgElement ? imgElement.getAttribute('src') : '';
        const absoluteImgSrc = imgSrc ? (imgSrc.startsWith('http') ? imgSrc : `${window.location.origin}${imgSrc}`) : '';
        
        // Extract content
        const clientNameContainer = htmlPage.querySelector('[data-pdf-client-name]');
        const clientNameHtml = clientNameContainer ? clientNameContainer.innerHTML : '';
        
        const pricingTableContainer = htmlPage.querySelector('[data-pdf-pricing-table]');
        const pricingTableHtml = pricingTableContainer ? pricingTableContainer.innerHTML : '';
        
        pagesHtml += `
          <div class="pdf-page" style="
            position: relative;
            width: 1122.5px;
            height: 631px;
            margin: 0;
            padding: 0;
            background-color: white;
            overflow: hidden;
            display: block;
          ">
            ${absoluteImgSrc ? `
              <img src="${absoluteImgSrc}" crossorigin="anonymous" style="
                position: absolute;
                top: 0;
                left: 0;
                width: 1122.5px;
                height: 631px;
                object-fit: cover;
                display: block;
                border: none;
                margin: 0;
                padding: 0;
              " />
            ` : ''}
            
            ${index === 0 && clientNameHtml ? `
              <div style="
                position: absolute;
                top: 72%;
                left: 0;
                width: 100%;
                text-align: center;
                color: white;
                font-size: 32px;
                font-weight: bold;
                text-transform: uppercase;
                font-family: Arial, sans-serif;
                z-index: 10;
              ">
                ${clientNameHtml}
              </div>
            ` : ''}

            ${index === 14 && pricingTableHtml ? `
              <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 1122.5px;
                height: 631px;
                z-index: 20;
                background: transparent;
                box-sizing: border-box;
                font-family: Arial, sans-serif;
              ">${pricingTableHtml}</div>
            ` : ''}
          </div>
        `;
      });

      const isolatedHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              * { box-sizing: border-box; }
              html, body { 
                margin: 0 !important; 
                padding: 0 !important; 
                width: 1122.5px !important;
                background: white;
                overflow: hidden;
              }
              .pdf-page {
                width: 1122.5px;
                height: 631px;
                page-break-after: always;
                page-break-inside: avoid;
                break-after: page;
                margin: 0 !important;
                padding: 0 !important;
              }
              .pdf-page:last-child {
                page-break-after: avoid;
                break-after: avoid;
              }
              img { display: block; border: none; margin: 0; padding: 0; }
            </style>
          </head>
          <body>
            <div style="width: 1122.5px; font-size: 0; line-height: 0; margin: 0; padding: 0; display: block;">
              ${pagesHtml}
            </div>
          </body>
        </html>
      `;

      const opt = {
        margin: 0,
        filename: `Proposta_Grape_Midia_${clientName.trim().replace(/\s+/g, '_') || 'Cliente'}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
          scale: 2,
          useCORS: true, 
          logging: false,
          backgroundColor: '#ffffff',
          width: 1122.5,
          windowWidth: 1122.5,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { unit: 'pt', format: [841.875, 473.55], orientation: 'landscape' },
        pagebreak: { mode: 'css' }
      };

      // @ts-ignore
      await html2pdf().set(opt).from(isolatedHtml).save();
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      alert("Erro ao exportar PDF. Por favor, tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#121212] overflow-hidden font-sans relative">
      {/* Painel Lateral */}
      <aside className="w-80 bg-[#1e1e1e] border-r border-white/10 p-8 flex flex-col gap-8 z-10 shadow-2xl overflow-y-auto">
        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#4a0080] to-[#cc00cc] rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white">
              <path d="M12,2C11.45,2,11,2.45,11,3v1.1c-3.37,0.46-6,3.35-6,6.9c0,3.87,3.13,7,7,7s7-3.13,7-7c0-3.55-2.63-6.44-6-6.9V3 C13,2.45,12.55,2,12,2z" />
            </svg>
          </div>
          <h1 className="font-black text-xl text-white tracking-tighter">GRAPE <span className="text-[#cc00cc]">MÍDIA</span></h1>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.3em]">Gerador de Propostas</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-[#cc00cc]" /> Nome do Cliente
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nome do Escritório"
              className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white focus:border-[#cc00cc] focus:ring-1 focus:ring-[#cc00cc] outline-none transition-all placeholder:text-white/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
              <CalendarIcon size={14} className="text-[#cc00cc]" /> Data da Proposta
            </label>
            <input
              type="text"
              value={proposalDate}
              onChange={(e) => setProposalDate(e.target.value)}
              placeholder="DD/MM/AAAA"
              className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white focus:border-[#cc00cc] focus:ring-1 focus:ring-[#cc00cc] outline-none transition-all placeholder:text-white/20"
            />
          </div>

          <div className="pt-4 border-t border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              <span className="w-2 h-2 bg-[#cc00cc] rounded-full"></span>
              <span>Configurações de Preço</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 uppercase font-bold">Com Voucher</label>
                <input 
                  type="text" 
                  value={pricing.withVoucher} 
                  onChange={(e) => setPricing({...pricing, withVoucher: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2 rounded text-[11px] text-white outline-none focus:border-[#cc00cc]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 uppercase font-bold">Sem Voucher</label>
                <input 
                  type="text" 
                  value={pricing.withoutVoucher} 
                  onChange={(e) => setPricing({...pricing, withoutVoucher: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2 rounded text-[11px] text-white outline-none focus:border-[#cc00cc]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 uppercase font-bold">Economia</label>
                <input 
                  type="text" 
                  value={pricing.economy} 
                  onChange={(e) => setPricing({...pricing, economy: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2 rounded text-[11px] text-white outline-none focus:border-[#cc00cc]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 uppercase font-bold">Entrada (Voucher)</label>
                <input 
                  type="text" 
                  value={pricing.entryWithVoucher} 
                  onChange={(e) => setPricing({...pricing, entryWithVoucher: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2 rounded text-[11px] text-white outline-none focus:border-[#cc00cc]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 uppercase font-bold">Parcela (Voucher)</label>
                <input 
                  type="text" 
                  value={pricing.installmentWithVoucher} 
                  onChange={(e) => setPricing({...pricing, installmentWithVoucher: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2 rounded text-[11px] text-white outline-none focus:border-[#cc00cc]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 uppercase font-bold">Entrada (Sem Voucher)</label>
                <input 
                  type="text" 
                  value={pricing.entryWithoutVoucher} 
                  onChange={(e) => setPricing({...pricing, entryWithoutVoucher: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2 rounded text-[11px] text-white outline-none focus:border-[#cc00cc]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 uppercase font-bold">Parcela (Sem Voucher)</label>
                <input 
                  type="text" 
                  value={pricing.installmentWithoutVoucher} 
                  onChange={(e) => setPricing({...pricing, installmentWithoutVoucher: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 p-2 rounded text-[11px] text-white outline-none focus:border-[#cc00cc]"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="mt-auto w-full bg-[#7c3aed] hover:bg-[#cc00cc] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-900/20 active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest text-sm"
        >
          {isExporting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <Download size={18} /> Exportar PDF
            </>
          )}
        </button>
      </aside>

      {/* Área de Preview */}
      <main className="flex-1 overflow-y-auto p-12 bg-black scrollbar-hide flex flex-col items-center">
        <div className="mb-6 flex items-center gap-4 bg-white/5 p-2 rounded-full border border-white/10">
          <div className="flex items-center gap-2 px-4 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Modo Imagens Locais</span>
          </div>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-4">Zoom do Preview</span>
          <input 
            type="range" 
            min="0.3" 
            max="1" 
            step="0.05" 
            value={previewScale} 
            onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
            className="w-32 accent-[#cc00cc]"
          />
          <span className="text-[10px] font-bold text-white/60 w-10">{Math.round(previewScale * 100)}%</span>
        </div>

        <div 
          ref={proposalRef} 
          className="proposal-container flex flex-col items-center origin-top transition-transform duration-300 bg-black"
          style={{ transform: `scale(${previewScale})`, gap: 0 }}
        >
          
          {/* PÁGINA 1 - CAPA */}
          <ProposalPage 
            pageNumber={1} 
            status={imageStatus[1]} 
            onStatusChange={(s) => handleStatusChange(1, s)}
            hideStatus={isExporting}
          >
            <div data-pdf-client-name className="absolute top-[72%] left-0 w-full text-center">
              <p className="text-white text-2xl font-medium tracking-wide">
                <span className="font-bold">{clientName || "____________________"}</span>
              </p>
            </div>
          </ProposalPage>

          {/* PÁGINAS 2 A 14 */}
          {Array.from({ length: 13 }).map((_, i) => {
            const pageNum = i + 2;
            return (
              <ProposalPage 
                key={pageNum} 
                pageNumber={pageNum} 
                status={imageStatus[pageNum]} 
                onStatusChange={(s) => handleStatusChange(pageNum, s)}
                hideStatus={isExporting}
              />
            );
          })}

          {/* PÁGINA 15 - FINAL */}
          <ProposalPage 
            pageNumber={15} 
            status={imageStatus[15]} 
            onStatusChange={(s) => handleStatusChange(15, s)}
            hideStatus={isExporting}
          >
            <div data-pdf-pricing-table className="absolute inset-0 z-20 pointer-events-none" style={{ position: 'absolute', inset: 0, zIndex: 20, fontFamily: 'Arial, sans-serif', pointerEvents: 'none' }}>
              {/* COM VOUCHER (ESQUERDA) */}
              <div style={{ position: 'absolute', left: '200px', top: '218px', width: '320px', textAlign: 'center' }}>
                <div style={{ fontSize: '52px', fontWeight: 900, color: 'white', lineHeight: 1, fontFamily: 'Arial Black, Arial, sans-serif' }}>R${pricing.withVoucher}</div>
              </div>
              
              <div style={{ position: 'absolute', left: '200px', top: '312px', width: '320px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '11px', paddingRight: '45px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: 'white', fontFamily: 'Arial Black, Arial, sans-serif' }}>R${pricing.entryWithVoucher}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '11px', paddingRight: '45px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: 'white', fontFamily: 'Arial Black, Arial, sans-serif' }}>R${pricing.installmentWithVoucher}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '11px', paddingRight: '45px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: 'white', fontFamily: 'Arial Black, Arial, sans-serif' }}>R${pricing.installmentWithVoucher}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '45px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: 'white', fontFamily: 'Arial Black, Arial, sans-serif' }}>R${pricing.installmentWithVoucher}</span>
                </div>
              </div>

              <div style={{ position: 'absolute', left: '200px', top: '538px', width: '320px', zIndex: 50 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '40px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: 'white', fontFamily: 'Arial Black, Arial, sans-serif' }}>{pricing.economy}</span>
                </div>
              </div>

              {/* SEM VOUCHER (DIREITA) */}
              <div style={{ position: 'absolute', left: '602px', top: '218px', width: '320px', textAlign: 'center' }}>
                <div style={{ fontSize: '52px', fontWeight: 900, color: '#2a0050', lineHeight: 1, fontFamily: 'Arial Black, Arial, sans-serif' }}>R${pricing.withoutVoucher}</div>
              </div>

              <div style={{ position: 'absolute', left: '602px', top: '312px', width: '320px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '11px', paddingRight: '45px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#2a0050', fontFamily: 'Arial Black, Arial, sans-serif' }}>R${pricing.entryWithoutVoucher}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '11px', paddingRight: '45px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#2a0050', fontFamily: 'Arial Black, Arial, sans-serif' }}>R${pricing.installmentWithoutVoucher}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '11px', paddingRight: '45px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#2a0050', fontFamily: 'Arial Black, Arial, sans-serif' }}>R${pricing.installmentWithoutVoucher}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '45px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#2a0050', fontFamily: 'Arial Black, Arial, sans-serif' }}>R${pricing.installmentWithoutVoucher}</span>
                </div>
              </div>

              <div style={{ position: 'absolute', left: '602px', top: '515px', width: '320px', textAlign: 'center' }}>
                {/* Removido o texto redundante pois já existe no fundo */}
              </div>

              {/* VALIDADE */}
              <div style={{ position: 'absolute', bottom: '0px', left: 0, width: '100%', backgroundColor: '#800000', padding: '10px 0', textAlign: 'center' }}>
                <span style={{ color: '#ffcc00', fontWeight: 900, fontSize: '20px', textTransform: 'uppercase', letterSpacing: '0.025em', fontFamily: 'Arial Black, Arial, sans-serif' }}>
                  Proposta válida até {proposalDate}
                </span>
              </div>
            </div>
          </ProposalPage>

        </div>
      </main>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .proposal-page {
          page-break-after: always;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
        }
        @media print {
          .proposal-page {
            margin-bottom: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
