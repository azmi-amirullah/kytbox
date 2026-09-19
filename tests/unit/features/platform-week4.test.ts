/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { describe, it, expect, vi } from 'vitest';
import JSZip from 'jszip';
import {
  generateExportJson,
  generateExportZip,
  extractUserData,
  type UserExportData,
} from '@/features/settings/data-export';
import { addLinkSchema, updateLinkSchema } from '@/features/bio/schemas.server';
import { linkDtoSchema } from '@/features/bio/schemas.client';
import { mapLinkToDTO } from '@/lib/mappers';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

describe('Week 4: Platform Data Vault & Bio Bento Features', () => {
  const mockUserId = 'user-uuid-week4';

  const mockExportData: UserExportData = {
    manifest: {
      app: 'Kytbox',
      version: '2026.09',
      exported_at: '2026-09-22T08:00:00.000Z',
      user_id: mockUserId,
      format_version: '2026.09',
      summary: {
        profile: 1,
        bio_links: 3,
        bio_subscribers: 0,
        custom_domains: 0,
        cashflow_books: 1,
        cashflow_transactions: 2,
        cashflow_splits: 0,
        cashflow_budgets: 1,
        cashflow_goals: 1,
        cashflow_tags: 1,
        lists: 1,
        list_columns: 2,
        list_items: 2,
        list_subtasks: 0,
        invoices: 0,
        invoice_items: 0,
        garage_vehicles: 1,
        garage_services: 1,
        garage_rules: 1,
        garage_fuel_logs: 1,
        garage_documents: 1,
        garage_licenses: 1,
      },
    },
    profile: {
      id: mockUserId,
      username: 'alexbuilder',
      display_name: 'Alex Builder',
      bio: 'Sovereign software builder',
      avatar_url: 'https://example.com/avatar.jpg',
      theme_name: 'slate',
      button_style: 'rounded',
      button_shape: 'pill',
      default_currency: 'USD',
      role: 'user',
      created_at: '2026-09-01T00:00:00Z',
      has_completed_onboarding: true,
      lead_capture_enabled: false,
      custom_theme: null,
      meta_description: null,
      meta_title: null,
      og_image_url: null,
      social_links: {},
      tier: 'free',
    },
    bio: {
      links: [
        {
          id: 'link-1',
          user_id: mockUserId,
          title: 'Featured Podcast Episode',
          url: 'https://kytbox.io/podcast',
          sort_order: 1,
          is_active: true,
          created_at: '2026-09-10T00:00:00Z',
          animation_type: null,
          clicks: 142,
          display_mode: 'link',
          grid_size: '2x2',
          stream_url: 'https://stream.example.com/episode42.mp3',
          audio_artist: 'Alex Rivera',
          audio_cover_url: 'https://images.unsplash.com/photo-podcast',
          expires_at: null,
          icon_url: null,
          is_folder: false,
          is_header: false,
          is_pinned: true,
          is_sensitive: false,
          last_clicked_at: null,
          parent_id: null,
          scheduled_at: null,
          short_id: 42,
        },
      ],
      subscribers: [],
      domains: [],
    },
    cashflow: {
      cashflows: [
        {
          id: 'cf-1',
          user_id: mockUserId,
          title: 'Personal Cashflow',
          created_at: '2026-09-01T00:00:00Z',
          updated_at: '2026-09-01T00:00:00Z',
          is_public: false,
          is_pinned: false,
          is_archived: false,
        },
      ],
      entries: [
        {
          id: 'entry-1',
          cashflow_id: 'cf-1',
          type: 'expense',
          amount: 45.5,
          date: '2026-09-15',
          description: 'Car Fuel',
          category: 'Transport',
          created_at: '2026-09-15T00:00:00Z',
          goal_id: null,
          is_recurring: false,
          recurring_rule_id: null,
          receipt_url: null,
          recurrence_interval: null,
          tags: ['fuel'],
          yearly_calculation: null,
          exchange_rate: 1,
          original_amount: null,
          original_currency: null,
        },
      ],
      split_entries: [],
      budgets: [],
      goals: [],
      tags: [],
      shares: [],
    },
    list: {
      lists: [
        {
          id: 'list-1',
          user_id: mockUserId,
          title: 'Garage Upgrades',
          slug: 'garage-upgrades',
          type: 'kanban',
          description: 'Car maintenance roadmap',
          is_public: false,
          created_at: '2026-09-01T00:00:00Z',
          updated_at: '2026-09-01T00:00:00Z',
        },
      ],
      columns: [],
      items: [
        {
          id: 'item-1',
          list_id: 'list-1',
          column_id: null,
          title: 'Brake pads replacement',
          description: null,
          sort_order: 1,
          is_completed: false,
          priority: 'high',
          due_date: '2026-09-30',
          reminder_sent: false,
          recurrence_rule: null,
          metadata: null,
          labels: [],
          created_at: '2026-09-02T00:00:00Z',
        },
      ],
      subtasks: [],
      labels: [],
      resources: [],
    },
    invoices: {
      invoices: [],
      items: [],
    },
    garage: {
      vehicles: [
        {
          id: 'veh-1',
          user_id: mockUserId,
          name: 'GR Yaris',
          type: 'car',
          year: 2024,
          license_plate: 'B 1234 KYT',
          vin: 'JT1234567890',
          current_odometer: 15200,
          odometer_unit: 'km',
          estimated_monthly_km: 1000,
          fuel_type: 'petrol',
          transmission: 'manual',
          currency: 'USD',
          is_default: true,
          is_archived: false,
          preferred_cashflow_id: null,
          created_at: '2026-09-01T00:00:00Z',
          updated_at: '2026-09-01T00:00:00Z',
        },
      ],
      services: [
        {
          id: 'srv-1',
          vehicle_id: 'veh-1',
          user_id: mockUserId,
          service_date: '2026-09-10',
          odometer: 15000,
          service_type: 'routine',
          items_serviced: ['Oil & Filter Change'],
          serviced_rule_ids: ['rule-1'],
          cost: 120.0,
          workshop_name: 'Toyota Service Center',
          invoice_number: 'INV-15000',
          external_invoice_url: null,
          notes: 'Standard 15k service completed',
          cashflow_entry_id: null,
          created_at: '2026-09-10T00:00:00Z',
        },
      ],
      maintenance_rules: [
        {
          id: 'rule-1',
          vehicle_id: 'veh-1',
          user_id: mockUserId,
          name: 'Engine Oil Replacement',
          category: 'fluids',
          interval_distance: 10000,
          interval_months: 6,
          last_service_odometer: 15000,
          last_service_date: '2026-09-10',
          is_active: true,
          created_at: '2026-09-01T00:00:00Z',
        },
      ],
      fuel_logs: [
        {
          id: 'fuel-1',
          vehicle_id: 'veh-1',
          user_id: mockUserId,
          log_date: '2026-09-12',
          odometer: 15150,
          fuel_amount: 35.5,
          price_per_unit: 1.5,
          total_cost: 53.25,
          is_full_tank: true,
          is_missed_previous: false,
          battery_start_pct: null,
          battery_end_pct: null,
          calculated_kml: 12.5,
          notes: null,
          cashflow_entry_id: null,
          created_at: '2026-09-12T00:00:00Z',
        },
      ],
      documents: [
        {
          id: 'doc-1',
          vehicle_id: 'veh-1',
          user_id: mockUserId,
          title: 'STNK Vehicle Registration',
          document_type: 'registration_renewal',
          document_number: 'STNK-1234',
          expiry_date: '2027-09-01',
          cost: 250,
          notes: null,
          cashflow_entry_id: null,
          created_at: '2026-09-01T00:00:00Z',
        },
      ],
      licenses: [
        {
          id: 'lic-1',
          user_id: mockUserId,
          license_name: 'Driver License',
          category: 'car',
          license_number: 'SIM-12345678',
          expiry_date: '2029-05-15',
          notes: null,
          created_at: '2026-09-01T00:00:00Z',
        },
      ],
      odometers: [
        {
          id: 'odo-1',
          vehicle_id: 'veh-1',
          year_month: '2026-09',
          odometer: 15200,
          updated_at: '2026-09-15T00:00:00Z',
          user_id: mockUserId,
        },
      ],
    },
  };

  describe('Day 22: Platform Sovereign Data Vault', () => {
    it('generates a valid sovereign JSON export with metadata and stripped credentials', () => {
      const jsonStr = generateExportJson(mockExportData);
      expect(typeof jsonStr).toBe('string');

      const parsed = JSON.parse(jsonStr);
      expect(parsed.schema_version).toBe('2026.09');
      expect(parsed.account.id).toBe(mockUserId);
      expect(parsed.account.username).toBe('alexbuilder');
      expect(parsed.manifest.app).toBe('Kytbox');
      expect(parsed.manifest.user_id).toBe(mockUserId);
      expect(parsed.data.profile.username).toBe('alexbuilder');
      expect(parsed.data.garage.vehicles).toHaveLength(1);
      expect(parsed.data.garage.vehicles[0].name).toBe('GR Yaris');
      expect(parsed.data.garage.services[0].items_serviced[0]).toContain('Oil');
      expect(parsed.data.garage.fuel_logs[0].fuel_amount).toBe(35.5);
      expect(parsed.data.cashflow.entries[0].amount).toBe(45.5);
      expect(parsed.data.list.items[0].title).toBe('Brake pads replacement');

      // Confidential session tokens or passwords must never exist in export
      expect(jsonStr).not.toContain('access_token');
      expect(jsonStr).not.toContain('refresh_token');
      expect(jsonStr).not.toContain('encrypted_password');
    });

    it('generates a valid ZIP archive containing garage.json and domain data files', async () => {
      const zipBytes = await generateExportZip(mockExportData);
      expect(zipBytes).toBeInstanceOf(Uint8Array);
      expect(zipBytes.length).toBeGreaterThan(100);

      const unzipped = await JSZip.loadAsync(zipBytes);
      const fileNames = Object.keys(unzipped.files);

      expect(fileNames).toContain('README.txt');
      expect(fileNames).toContain('manifest.json');
      expect(fileNames).toContain('profile.json');
      expect(fileNames).toContain('bio.json');
      expect(fileNames).toContain('cashflow.json');
      expect(fileNames).toContain('list.json');
      expect(fileNames).toContain('garage.json');

      const garageStr = await unzipped.file('garage.json')!.async('string');
      const parsedGarage = JSON.parse(garageStr);
      expect(parsedGarage.vehicles[0].name).toBe('GR Yaris');
      expect(parsedGarage.fuel_logs[0].total_cost).toBe(53.25);
      expect(parsedGarage.licenses[0].category).toBe('car');
    });

    it('extracts complete user data across all tables from database client', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          const chain: Record<string, unknown> = {};
          chain.select = vi.fn().mockReturnValue(chain);
          chain.eq = vi.fn().mockReturnValue(chain);
          chain.in = vi.fn().mockReturnValue(chain);
          chain.order = vi.fn().mockReturnValue(chain);
          chain.maybeSingle = vi.fn().mockResolvedValue({
            data: table === 'profiles' ? { id: mockUserId, username: 'alexbuilder' } : null,
            error: null,
          });
          chain.then = (resolve: (val: unknown) => void) => {
            resolve({
              data:
                table === 'profiles'
                  ? { id: mockUserId, username: 'alexbuilder' }
                  : table === 'vehicles'
                  ? [{ id: 'veh-1', user_id: mockUserId, name: 'GR Yaris' }]
                  : [],
              error: null,
            });
          };
          return chain;
        }),
      } as unknown as SupabaseClient<Database>;

      const extracted = await extractUserData(mockUserId, mockSupabase);
      expect(extracted.manifest.user_id).toBe(mockUserId);
      expect(extracted.manifest.summary.profile).toBe(1);
      expect(extracted.manifest.format_version).toBe('2026.09');
    });
  });

  describe('Day 25 & 26: Bio Bento Grid Layout & Audio Stream', () => {
    it('validates Bento grid_size values strictly with safe defaults', () => {
      const validSizes = ['1x1', '1x2', '2x2', 'full'] as const;
      for (const size of validSizes) {
        const result = addLinkSchema.safeParse({
          title: 'Tile Link',
          url: 'https://kytbox.io',
          grid_size: size,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.grid_size).toBe(size);
        }
      }

      // Default fallback when grid_size is omitted
      const defaultResult = addLinkSchema.safeParse({
        title: 'Normal Link',
        url: 'https://kytbox.io',
      });
      expect(defaultResult.success).toBe(true);
      if (defaultResult.success) {
        expect(defaultResult.data.grid_size).toBe('full');
      }

      // Invalid grid_size should fail validation
      const invalidResult = addLinkSchema.safeParse({
        title: 'Bad Size',
        url: 'https://kytbox.io',
        grid_size: '3x3',
      });
      expect(invalidResult.success).toBe(false);
    });

    it('validates audio stream URLs and metadata on links', () => {
      const validAudioLink = addLinkSchema.safeParse({
        title: 'Lo-Fi Study Beat',
        url: 'https://kytbox.io/music',
        stream_url: 'https://cdn.example.com/audio/study.mp3',
        audio_artist: 'Chill Coder',
        audio_cover_url: 'https://cdn.example.com/cover.jpg',
        grid_size: '1x1',
      });

      expect(validAudioLink.success).toBe(true);
      if (validAudioLink.success) {
        expect(validAudioLink.data.stream_url).toBe('https://cdn.example.com/audio/study.mp3');
        expect(validAudioLink.data.audio_artist).toBe('Chill Coder');
      }

      // Empty stream_url is allowed (optional)
      const emptyAudioLink = updateLinkSchema.safeParse({
        title: 'Updated Link',
        stream_url: '',
      });
      expect(emptyAudioLink.success).toBe(true);
    });

    it('maps database link rows to LinkDTO with safe literal branch guards', () => {
      const rawDbRow = {
        id: 'link-bento-1',
        user_id: mockUserId,
        title: 'Bento Showcase',
        url: 'https://kytbox.io',
        sort_order: 1,
        is_active: true,
        created_at: '2026-09-22T00:00:00Z',
        animation_type: 'pulse',
        clicks: 50,
        display_mode: 'link',
        grid_size: '2x2',
        stream_url: 'https://kytbox.io/track.mp3',
        audio_artist: 'Alex',
        audio_cover_url: 'https://kytbox.io/art.jpg',
        expires_at: null,
        icon_url: null,
        is_folder: false,
        is_header: false,
        is_pinned: false,
        is_sensitive: false,
        last_clicked_at: null,
        parent_id: null,
        scheduled_at: null,
        short_id: 101,
      };

      const dto = mapLinkToDTO(rawDbRow);
      expect(dto.grid_size).toBe('2x2');
      expect(dto.stream_url).toBe('https://kytbox.io/track.mp3');
      expect(dto.audio_artist).toBe('Alex');
      expect(dto.audio_cover_url).toBe('https://kytbox.io/art.jpg');

      // Validates against client LinkDTO schema
      const clientValidation = linkDtoSchema.safeParse(dto);
      expect(clientValidation.success).toBe(true);
    });

    it('gracefully handles unknown or corrupt grid_size values by defaulting to full', () => {
      const corruptRow = {
        id: 'link-corrupt',
        user_id: mockUserId,
        title: 'Corrupt Grid Link',
        url: 'https://kytbox.io',
        sort_order: 1,
        is_active: true,
        created_at: '2026-09-22T00:00:00Z',
        animation_type: null,
        clicks: 0,
        display_mode: 'link',
        grid_size: 'unknown_size_val',
        stream_url: null,
        audio_artist: null,
        audio_cover_url: null,
        expires_at: null,
        icon_url: null,
        is_folder: false,
        is_header: false,
        is_pinned: false,
        is_sensitive: false,
        last_clicked_at: null,
        parent_id: null,
        scheduled_at: null,
        short_id: 102,
      };

      const dto = mapLinkToDTO(corruptRow);
      expect(dto.grid_size).toBe('full');
    });
  });
});
