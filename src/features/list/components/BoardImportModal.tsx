'use client';

import { useState, useRef, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LuUpload,
  LuFileSpreadsheet,
  LuCircleCheck,
  LuArrowRight,
  LuLoader,
  LuColumns2,
  LuLayers,
} from 'react-icons/lu';
import {
  parseImportContent,
  parseCsvBoard,
  type ParsedImportData,
  type CsvColumnMapping,
} from '../lib/board-importer';
import { importBoardBatch } from '../actions';
import { toast } from 'react-toastify';

interface BoardImportModalProps {
  listId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

const CHUNK_SIZE = 50;

export default function BoardImportModal({
  listId,
  open,
  onOpenChange,
  onImportComplete,
}: BoardImportModalProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'importing' | 'complete'>('upload');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [parsedData, setParsedData] = useState<ParsedImportData | null>(null);
  const [mapping, setMapping] = useState<CsvColumnMapping>({
    title: '',
    column: '',
    dueDate: '',
    priority: '',
    description: '',
    labels: '',
  });
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      setFileContent(text);

      const parsed = parseImportContent(text, file.name);
      setParsedData(parsed);

      if (parsed.source === 'csv' && parsed.rawHeaders && parsed.rawHeaders.length > 0) {
        // Auto-mapping defaults
        const cleanHeaders = parsed.rawHeaders;
        const initialTitle = cleanHeaders.find((h) => /title|name|task/i.test(h)) || cleanHeaders[0] || '';
        const initialCol = cleanHeaders.find((h) => /status|column|list|phase/i.test(h)) || cleanHeaders[1] || '';
        const initialDue = cleanHeaders.find((h) => /due|deadline|date/i.test(h)) || '';
        const initialPrio = cleanHeaders.find((h) => /priority|urgency/i.test(h)) || '';
        const initialDesc = cleanHeaders.find((h) => /desc|note|detail/i.test(h)) || '';
        const initialLabels = cleanHeaders.find((h) => /label|tag/i.test(h)) || '';

        setMapping({
          title: initialTitle,
          column: initialCol,
          dueDate: initialDue,
          priority: initialPrio,
          description: initialDesc,
          labels: initialLabels,
        });
        setStep('mapping');
      } else {
        setStep('mapping');
      }
    };
    reader.readAsText(file);
  };

  const handleReapplyMapping = (newMapping: Partial<CsvColumnMapping>) => {
    const updated = { ...mapping, ...newMapping };
    setMapping(updated);
    if (fileContent && parsedData?.source === 'csv') {
      const reParsed = parseCsvBoard(fileContent, updated);
      setParsedData(reParsed);
    }
  };

  const executeImport = () => {
    if (!parsedData || parsedData.cards.length === 0) return;

    setStep('importing');
    const allCards = parsedData.cards;
    const totalBatches = Math.ceil(allCards.length / CHUNK_SIZE);
    setProgress({ current: 0, total: allCards.length });

    startTransition(async () => {
      let importedTotal = 0;

      for (let i = 0; i < totalBatches; i++) {
        const chunk = allCards.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const result = await importBoardBatch(listId, parsedData.columns, chunk);

        if (result.error) {
          toast.error(`Batch ${i + 1} failed: ${result.error}`);
          setStep('mapping');
          return;
        }

        importedTotal += chunk.length;
        setProgress({ current: importedTotal, total: allCards.length });
      }

      toast.success(`Successfully imported ${importedTotal} cards!`);
      setStep('complete');
      onImportComplete?.();
    });
  };

  const resetState = () => {
    setStep('upload');
    setFileName('');
    setFileContent('');
    setParsedData(null);
    setProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) {
          if (!next) resetState();
          onOpenChange(next);
        }
      }}
    >
      <DialogContent className='max-w-xl p-6 bg-card rounded-2xl border-border'>
        <DialogHeader className='space-y-1.5'>
          <DialogTitle className='text-base font-semibold flex items-center gap-2 text-foreground'>
            <LuUpload className='h-4 w-4 text-primary' />
            Import Board (Trello & Notion)
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            Migrate boards seamlessly from Trello JSON or Notion/Excel CSV exports. Processed 100% in your browser (0 bytes server storage).
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload File */}
        {step === 'upload' && (
          <div className='py-6 text-center space-y-4'>
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='w-full text-center border-2 border-dashed border-border/80 hover:border-primary/70 rounded-2xl p-8 cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40 space-y-3 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            >
              <div className='w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto'>
                <LuFileSpreadsheet className='w-6 h-6' />
              </div>
              <div className='space-y-1'>
                <p className='text-sm font-medium text-foreground'>
                  Click to select Trello (.json) or CSV (.csv) export
                </p>
                <p className='text-xs text-muted-foreground'>
                  Supports Trello JSON, Notion Table CSV, Jira, and generic spreadsheet exports
                </p>
              </div>
            </button>

            <input
              ref={fileInputRef}
              type='file'
              accept='.json,.csv,text/csv,application/json'
              onChange={handleFileChange}
              className='hidden'
            />
          </div>
        )}

        {/* Step 2: Column Mapping & Preview */}
        {step === 'mapping' && parsedData && (
          <div className='space-y-4 pt-2'>
            {/* Source Info Badge */}
            <div className='flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/80 text-xs'>
              <div className='flex items-center gap-2'>
                <span className='font-semibold text-foreground'>{fileName}</span>
                <span className='px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-primary/10 text-primary'>
                  {parsedData.source === 'trello_json' ? 'Trello JSON' : 'CSV Table'}
                </span>
              </div>
              <div className='flex items-center gap-3 text-muted-foreground text-[11px]'>
                <span><strong>{parsedData.columns.length}</strong> columns</span>
                <span><strong>{parsedData.cards.length}</strong> cards</span>
              </div>
            </div>

            {/* CSV Interactive Column Dropdowns (if CSV) */}
            {parsedData.source === 'csv' && parsedData.rawHeaders && (
              <div className='space-y-3 p-3 rounded-xl border border-border bg-card'>
                <h4 className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                  <LuColumns2 className='h-3.5 w-3.5 text-primary' />
                  Match Spreadsheet Columns
                </h4>

                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-1'>
                    <Label className='text-[11px] text-muted-foreground'>Card Title *</Label>
                    <Select
                      value={mapping.title}
                      onValueChange={(val) => handleReapplyMapping({ title: val })}
                    >
                      <SelectTrigger className='h-8 text-xs'>
                        <SelectValue placeholder='Select column' />
                      </SelectTrigger>
                      <SelectContent>
                        {parsedData.rawHeaders.map((h) => (
                          <SelectItem key={h} value={h} className='text-xs'>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-[11px] text-muted-foreground'>Status / Column *</Label>
                    <Select
                      value={mapping.column}
                      onValueChange={(val) => handleReapplyMapping({ column: val })}
                    >
                      <SelectTrigger className='h-8 text-xs'>
                        <SelectValue placeholder='Select column' />
                      </SelectTrigger>
                      <SelectContent>
                        {parsedData.rawHeaders.map((h) => (
                          <SelectItem key={h} value={h} className='text-xs'>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-[11px] text-muted-foreground'>Due Date (optional)</Label>
                    <Select
                      value={mapping.dueDate || '__none__'}
                      onValueChange={(val) =>
                        handleReapplyMapping({ dueDate: val === '__none__' ? '' : val })
                      }
                    >
                      <SelectTrigger className='h-8 text-xs'>
                        <SelectValue placeholder='(None)' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='__none__' className='text-xs text-muted-foreground'>
                          (None)
                        </SelectItem>
                        {parsedData.rawHeaders.map((h) => (
                          <SelectItem key={h} value={h} className='text-xs'>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-[11px] text-muted-foreground'>Priority (optional)</Label>
                    <Select
                      value={mapping.priority || '__none__'}
                      onValueChange={(val) =>
                        handleReapplyMapping({ priority: val === '__none__' ? '' : val })
                      }
                    >
                      <SelectTrigger className='h-8 text-xs'>
                        <SelectValue placeholder='(None)' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='__none__' className='text-xs text-muted-foreground'>
                          (None)
                        </SelectItem>
                        {parsedData.rawHeaders.map((h) => (
                          <SelectItem key={h} value={h} className='text-xs'>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Breakdown Cards */}
            <div className='space-y-1.5'>
              <Label className='text-[11px] text-muted-foreground font-semibold'>
                Board Columns & Card Preview ({parsedData.cards.length} cards)
              </Label>
              <div className='max-h-36 overflow-y-auto space-y-1 p-2 rounded-xl bg-muted/20 border border-border text-xs'>
                {parsedData.columns.map((colName) => {
                  const count = parsedData.cards.filter((c) => c.columnTitle === colName).length;
                  return (
                    <div
                      key={colName}
                      className='flex items-center justify-between px-2 py-1 rounded bg-card border border-border/50'
                    >
                      <span className='font-medium text-foreground flex items-center gap-1.5'>
                        <LuLayers className='h-3 w-3 text-muted-foreground' />
                        {colName}
                      </span>
                      <span className='text-[11px] px-1.5 py-0.2 rounded-full bg-muted font-semibold'>
                        {count} cards
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className='gap-2 sm:gap-0 pt-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={resetState}
                className='text-xs mr-auto'
              >
                Choose Another File
              </Button>
              <DialogClose asChild>
                <Button type='button' variant='outline' size='sm' className='text-xs'>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type='button'
                size='sm'
                onClick={executeImport}
                disabled={parsedData.cards.length === 0}
                className='text-xs gap-1.5'
              >
                <span>Commit Import</span>
                <LuArrowRight className='h-3.5 w-3.5' />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Progress Indicator */}
        {step === 'importing' && (
          <div className='py-8 text-center space-y-4'>
            <LuLoader className='h-8 w-8 text-primary animate-spin mx-auto' />
            <div className='space-y-1'>
              <h4 className='text-sm font-semibold text-foreground'>
                Importing board cards in batches...
              </h4>
              <p className='text-xs text-muted-foreground'>
                {progress.current} of {progress.total} cards imported
              </p>
            </div>
            <div className='w-full bg-muted rounded-full h-2 overflow-hidden max-w-xs mx-auto'>
              <div
                className='bg-primary h-full transition-all duration-300'
                style={{
                  width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className='py-8 text-center space-y-4'>
            <div className='w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto'>
              <LuCircleCheck className='w-6 h-6' />
            </div>
            <div className='space-y-1'>
              <h4 className='text-sm font-semibold text-foreground'>
                Import Finished Successfully!
              </h4>
              <p className='text-xs text-muted-foreground'>
                All columns, cards, due dates, and labels have been created on your board.
              </p>
            </div>
            <DialogFooter className='sm:justify-center pt-2'>
              <Button
                type='button'
                size='sm'
                onClick={() => {
                  onOpenChange(false);
                  resetState();
                }}
                className='text-xs px-6'
              >
                Close & View Board
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
