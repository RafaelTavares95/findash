'use client';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addSlot, addValueToSlot, removeSlot, setSlots } from '@/store/slices/reservesSlice';
import { Plus, Trash2, Wallet, Target, PiggyBank, ArrowUpRight, X, Download, Upload } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Form, ProgressBar, Badge } from 'react-bootstrap';
import FinancialInput from '@/components/FinancialInput';
import { toast } from 'react-hot-toast';

export default function ControlPage() {
  const dispatch = useAppDispatch();
  const { slots } = useAppSelector((state) => state.reserves);
  const { t, i18n } = useTranslation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const [newSlot, setNewSlot] = useState({ name: '', targetAmount: 0 });
  const [depositAmount, setDepositAmount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentUser } = useAppSelector((state) => state.user);

  const handleExport = () => {
    if (!currentUser) {
      toast.error(t('common.login_required_export'));
      return;
    }

    const exportData = {
      version: '1.0',
      userId: currentUser.id,
      userName: currentUser.name,
      exportDate: new Date().toISOString(),
      slots: slots
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `findash-data-${currentUser.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success(t('common.export_success'));
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) {
      toast.error(t('common.login_required_import'));
      return;
    }

    const fileReader = new FileReader();
    const file = event.target.files?.[0];
    
    if (file) {
      fileReader.onload = (e) => {
        try {
          const content = e.target?.result;
          if (typeof content === 'string') {
            const imported = JSON.parse(content);
            
            // Check if it's the new format with userId
            if (imported && typeof imported === 'object' && 'userId' in imported && 'slots' in imported) {
              if (imported.userId === currentUser.id) {
                if (Array.isArray(imported.slots)) {
                  dispatch(setSlots(imported.slots));
                  toast.success(t('common.import_success'));
                } else {
                  toast.error(t('common.import_error_format'));
                }
              } else {
                toast.error(`${t('common.import_error_user')} (${imported.userName || imported.userId}).`);
              }
            } 
            // Support legacy format (array of slots) but with a warning or restriction
            else if (Array.isArray(imported)) {
              // Optionally allow legacy import but warn, or block it to be strictly secure
              // Given the request "deve ser apenas os seus", blocking legacy is safer
              // but might be frustrating. Let's provide a clear message.
              toast.error('O arquivo não possui identificação de usuário. Para sua segurança, você só pode importar arquivos exportados nesta versão do app.');
            } else {
              toast.error('Formato de arquivo inválido.');
            }
          }
        } catch (error) {
          console.error('Erro ao importar arquivo:', error);
          toast.error(t('common.import_error_format'));
        }
      };
      fileReader.readAsText(file);
    }
  };

  const formatCurrency = (value: number) => {
    const locale = i18n.language.startsWith('pt') ? 'pt-BR' : 'en-US';
    const currency = i18n.language.startsWith('pt') ? 'BRL' : 'USD';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const totals = useMemo(() => {
    const saved = slots.reduce((acc, slot) => acc + slot.currentAmount, 0);
    const target = slots.reduce((acc, slot) => acc + slot.targetAmount, 0);
    const percentage = target > 0 ? (saved / target) * 100 : 0;
    return { saved, target, percentage };
  }, [slots]);

  const handleCreateSlot = () => {
    if (newSlot.name && newSlot.targetAmount > 0) {
      dispatch(addSlot(newSlot));
      setNewSlot({ name: '', targetAmount: 0 });
      setShowAddModal(false);
      // We don't have a specific translation for this yet, so I'll keep it or add it
      toast.success(i18n.language.startsWith('pt') ? 'Novo objetivo criado!' : 'New goal created!');
    }
  };

  const handleDeposit = () => {
    if (selectedSlotId && depositAmount > 0) {
      dispatch(addValueToSlot({ id: selectedSlotId, amount: depositAmount }));
      setDepositAmount(0);
      setShowDepositModal(false);
      toast.success(i18n.language.startsWith('pt') ? 'Aporte realizado!' : 'Deposit successful!');
    }
  };

  return (
    <div className="container-fluid py-2">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-4">
        <div>
          <Badge className="mb-2 px-3 py-2 rounded-pill text-uppercase tracking-widest bg-primary bg-opacity-10 text-primary border-0 fw-bold">
            {t('common.wealth_management')}
          </Badge>
          <h2 className="fw-900 mb-1 text-dark tracking-tight">{t('common.financial_control')}</h2>
          <p className="text-muted mb-0">{t('common.manage_goals')}</p>
        </div>
        <div className="d-flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            style={{ display: 'none' }}
          />
          <button 
            className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 py-2 hover-lift border-2" 
            onClick={() => fileInputRef.current?.click()}
            title={t('common.import')}
          >
            <Upload size={18} strokeWidth={2.5} /> 
            <span className="fw-800 d-none d-sm-inline">{t('common.import')}</span>
          </button>
          <button 
            className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 py-2 hover-lift border-2" 
            onClick={handleExport}
            title={t('common.export')}
          >
            <Download size={18} strokeWidth={2.5} /> 
            <span className="fw-800 d-none d-sm-inline">{t('common.export')}</span>
          </button>
          <button 
            className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 hover-lift shadow-lg" 
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={22} strokeWidth={3} /> 
            <span className="fw-800">{t('common.new_goal')}</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Card */}
      <div className="row mb-5 animate-in">
        <div className="col-12">
          <div className="card border-0 shadow-xl overflow-hidden rounded-4 stat-card-glow-primary" style={{ 
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: 'white'
          }}>
            <div className="card-body p-4 p-md-5">
              <div className="row align-items-center">
                <div className="col-lg-7">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="bg-primary rounded-4 p-3 shadow-lg">
                      <PiggyBank size={32} className="text-white" />
                    </div>
                    <div>
                      <h6 className="mb-0 text-white-50 fw-800 text-uppercase tracking-widest smaller">{t('common.allocated_wealth')}</h6>
                      <h1 className="display-4 fw-900 mb-0 mt-1 text-white">
                        {formatCurrency(totals.saved)}
                      </h1>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3 py-2 px-3 rounded-pill d-inline-flex border border-white border-opacity-10" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                    <div className="bg-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                      <ArrowUpRight size={14} className="text-white" />
                    </div>
                    <span className="small fw-semibold text-white">
                      {totals.percentage.toFixed(1)}% {t('common.of_total_target')} {formatCurrency(totals.target)}
                    </span>
                  </div>
                </div>
                <div className="col-lg-5 mt-5 mt-lg-0">
                  <div className="p-4 rounded-4 border border-white border-opacity-10 backdrop-blur" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <div className="d-flex justify-content-between mb-3">
                      <span className="fw-bold tracking-tight text-white">{t('common.overall_progress')}</span>
                      <span className="fw-bold text-primary">{totals.percentage.toFixed(0)}%</span>
                    </div>
                    <div className="progress mb-2" style={{ height: '10px', background: 'rgba(255,255,255,0.1)' }}>
                      <div 
                        className="progress-bar bg-primary shadow-sm" 
                        style={{ width: `${totals.percentage}%`, borderRadius: '10px' }}
                      ></div>
                    </div>
                    <p className="smaller text-white-50 mb-0 mt-3 text-center">
                      {t('common.consistency_message')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="row g-4 mb-5">
        {slots.length === 0 ? (
          <div className="col-12 text-center py-5 glass-card animate-in">
            <div className="bg-light rounded-circle p-4 d-inline-block mb-4">
              <Plus size={48} className="text-muted opacity-50" />
            </div>
            <h4 className="fw-bold text-dark">{t('common.no_goals')}</h4>
            <p className="text-muted mx-auto" style={{ maxWidth: '300px' }}>
              {t('common.define_first_goal')}
            </p>
            <button className="btn btn-outline-primary mt-3" onClick={() => setShowAddModal(true)}>
              {t('common.create_first_goal')}
            </button>
          </div>
        ) : (
          slots.map((slot, index) => {
            const percentage = (slot.currentAmount / slot.targetAmount) * 100;
            const remaining = Math.max(0, slot.targetAmount - slot.currentAmount);
            
            // Determinar status e cores do card
            const isCompleted = slot.currentAmount >= slot.targetAmount;
            const isInProgress = slot.currentAmount > 0 && slot.currentAmount < slot.targetAmount;
            const isNotStarted = slot.currentAmount === 0;
            
            // Definir estilos baseados no status
            const cardStyle = isCompleted 
              ? { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }
              : isInProgress 
                ? { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' }
                : { background: '#ffffff', color: 'inherit' };
            
            const iconBgClass = isCompleted 
              ? 'bg-white bg-opacity-25 text-white' 
              : isInProgress 
                ? 'bg-white bg-opacity-25 text-white' 
                : 'bg-primary bg-opacity-10 text-primary';
            
            const textColorClass = (isCompleted || isInProgress) ? 'text-white' : 'text-dark';
            const mutedTextClass = (isCompleted || isInProgress) ? 'text-white-50' : 'text-muted';
            const amountTextClass = (isCompleted || isInProgress) ? 'text-white' : 'text-primary';
            
            const statusLabel = isCompleted 
              ? (i18n.language.startsWith('pt') ? '✓ Concluído' : '✓ Completed')
              : isInProgress 
                ? (i18n.language.startsWith('pt') ? '● Em Progresso' : '● In Progress')
                : (i18n.language.startsWith('pt') ? '○ Não Iniciado' : '○ Not Started');
            
            const statusBadgeClass = isCompleted 
              ? 'bg-white bg-opacity-25 text-white' 
              : isInProgress 
                ? 'bg-white bg-opacity-25 text-white' 
                : 'bg-light text-muted';
            
            return (
              <div key={slot.id} className="col-12 col-md-6 col-xxl-4 animate-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="card h-100 border-0 shadow-sm hover-lift group" style={cardStyle}>
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-4">
                      <div className={`${iconBgClass} p-3 rounded-4 shadow-sm`}>
                        <Wallet size={24} />
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className={`badge ${statusBadgeClass} px-3 py-2 rounded-pill fw-bold smaller`}>
                          {statusLabel}
                        </span>
                        <button 
                          className={`btn btn-link ${mutedTextClass} p-2 rounded-circle hover-bg-danger border-0 transition-all opacity-0 group-hover-opacity-100`} 
                          onClick={() => {
                            dispatch(removeSlot(slot.id));
                            toast.success(t('common.goal_removed'));
                          }}
                          title={t('common.remove_goal')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <h5 className={`fw-800 mb-1 ${textColorClass} truncate-text`}>{slot.name}</h5>
                    <div className="d-flex align-items-baseline gap-2 mb-4">
                      <h4 className={`fw-900 ${amountTextClass} mb-0`}>{formatCurrency(slot.currentAmount)}</h4>
                      <span className={`${mutedTextClass} small fw-medium`}>/ {formatCurrency(slot.targetAmount)}</span>
                    </div>
                    
                    <div className="d-flex justify-content-between mb-2 small fw-800">
                      <span className={`${mutedTextClass} text-uppercase smaller tracking-widest`}>{t('common.evolution')}</span>
                      <span className={amountTextClass}>{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="progress mb-4" style={{ height: '8px', background: (isCompleted || isInProgress) ? 'rgba(255,255,255,0.2)' : undefined }}>
                      <div 
                        className={`progress-bar ${isCompleted ? 'bg-white' : isInProgress ? 'bg-white' : 'bg-primary'}`} 
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      ></div>
                    </div>

                    {remaining > 0 && (
                      <div className={`d-flex align-items-center gap-2 mb-4 p-2 rounded-3`} style={{ background: (isCompleted || isInProgress) ? 'rgba(255,255,255,0.15)' : '#f8f9fa' }}>
                        <Target size={16} className={amountTextClass} /> 
                        <span className={`smaller fw-bold ${mutedTextClass}`}>{t('common.still_missing')} {formatCurrency(remaining)}</span>
                      </div>
                    )}

                    <button 
                      className={`btn w-100 py-3 rounded-3 fw-800 d-flex align-items-center justify-content-center gap-2 border-0 shadow-sm ${(isCompleted || isInProgress) ? 'bg-white bg-opacity-25 text-white hover-bg-white' : 'btn-light text-primary hover-primary'}`}
                      onClick={() => {
                        setSelectedSlotId(slot.id);
                        setShowDepositModal(true);
                      }}
                    >
                      <Plus size={20} strokeWidth={3} /> {t('common.add_value')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals with custom styling */}
      <Modal 
        show={showAddModal} 
        onHide={() => setShowAddModal(false)} 
        centered
        contentClassName="border-0 shadow-2xl rounded-5 overflow-hidden"
      >
        <div className="p-1 bg-primary"></div>
        <Modal.Header className="border-0 p-5 pb-0" closeButton>
          <div>
            <Modal.Title className="fw-900 fs-2 tracking-tight">{t('common.new_goal_title')}</Modal.Title>
            <p className="text-muted mb-0">{t('common.new_goal_subtitle')}</p>
          </div>
        </Modal.Header>
        <Modal.Body className="p-5 pt-4">
          <Form onSubmit={(e) => { e.preventDefault(); handleCreateSlot(); }}>
            <Form.Group className="mb-4">
              <Form.Label className="fw-800 text-muted smaller text-uppercase tracking-widest">{t('common.goal_name_label')}</Form.Label>
              <Form.Control 
                type="text" 
                placeholder={t('common.goal_placeholder')} 
                className="form-control-lg border-2 py-3"
                value={newSlot.name}
                autoFocus
                onChange={(e) => setNewSlot({ ...newSlot, name: e.target.value })}
              />
            </Form.Group>

            <FinancialInput 
              label={`${t('common.financial_target_label')} (${i18n.language.startsWith('pt') ? 'R$' : '$'})`}
              placeholder="0,00"
              className="form-control-lg border-2 py-3"
              onValueChange={(val, name, values) => setNewSlot({ ...newSlot, targetAmount: values?.float || 0 })}
            />

            <div className="d-grid gap-2 mt-5">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleCreateSlot}
                disabled={!newSlot.name || newSlot.targetAmount <= 0}
                className="py-3 rounded-4 fw-800 shadow-lg border-0"
              >
                {t('common.start_journey')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal 
        show={showDepositModal} 
        onHide={() => setShowDepositModal(false)} 
        centered
        contentClassName="border-0 shadow-2xl rounded-5 overflow-hidden"
      >
        <div className="p-1 bg-success"></div>
        <Modal.Header className="border-0 p-5 pb-0" closeButton>
          <div>
            <Modal.Title className="fw-900 fs-2 tracking-tight">{t('common.new_deposit_title')}</Modal.Title>
            <p className="text-muted mb-0">{t('common.new_deposit_subtitle')}</p>
          </div>
        </Modal.Header>
        <Modal.Body className="p-5 pt-4">
          <Form onSubmit={(e) => { e.preventDefault(); handleDeposit(); }}>
            <FinancialInput 
              label={t('common.deposit_value_label')}
              placeholder="0,00"
              autoFocus
              className="form-control-lg border-2 py-3"
              onValueChange={(val, name, values) => setDepositAmount(values?.float || 0)}
            />

            <div className="d-grid gap-2 mt-5">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleDeposit}
                disabled={depositAmount <= 0}
                className="py-3 rounded-4 fw-800 shadow-lg border-0"
              >
                {t('common.confirm_deposit')}
              </Button>
              <Button 
                variant="link" 
                className="text-muted text-decoration-none fw-bold mt-2" 
                onClick={() => setShowDepositModal(false)}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <style jsx>{`
        .fw-800 { font-weight: 800; }
        .fw-900 { font-weight: 900; }
        .smaller { font-size: 0.7rem; }
        .tracking-widest { letter-spacing: 0.15em; }
        .tracking-tight { letter-spacing: -0.02em; }
        .hover-lift:hover { transform: translateY(-8px); }
        .group:hover .group-hover-opacity-100 { opacity: 1 !important; }
        .hover-bg-danger:hover { background-color: rgba(239, 68, 68, 0.1); color: #ef4444 !important; }
        .hover-primary:hover { background-color: var(--primary) !important; color: white !important; }
        .hover-bg-white:hover { background-color: rgba(255, 255, 255, 0.35) !important; }
        .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
        .backdrop-blur { backdrop-filter: blur(8px); }
        .text-white-50 { color: rgba(255, 255, 255, 0.6) !important; }
      `}</style>
    </div>
  );
}


