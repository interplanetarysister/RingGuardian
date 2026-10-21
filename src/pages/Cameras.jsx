import React, { useEffect, useState } from 'react';
import { Camera, Info, Radio } from 'lucide-react';
import Panel from '@/components/common/Panel';
import StatusPill from '@/components/common/StatusPill';
import { loadBoard } from '@/lib/board';
import { DEVICE_STATUS, meta } from '@/lib/status';
import { formatDateTime } from '@/lib/format';

export default function Cameras() {
  const [board, setBoard] = useState(null);

  useEffect(() => {
    let alive = true;
    loadBoard().then((b) => alive && setBoard(b));
    return () => {
      alive = false;
    };
  }, []);

  if (!board) return <div className="h-40 animate-pulse rounded-lg bg-muted/40" />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">Cameras</h1>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Guardian vest cameras are proposed hardware. The one Ring device in this build is a developer sandbox device
          exposed through the Ring adapter, and its events are simulated.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {board.cameras.map((camera) => {
          const status = meta(DEVICE_STATUS, camera.status);
          const employee = board.employees.find((e) => e.employee_id === camera.assigned_employee_id);
          const scanner = board.scanners.find((s) => s.paired_camera_id === camera.device_id);
          return (
            <div key={camera.id} className="rgc-panel p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="rgc-mono text-xs font-semibold text-foreground">{camera.device_id}</span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">{camera.model}</p>
                </div>
                <StatusPill tone={status.tone} label={status.label} />
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border pt-2.5">
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Facility</dt>
                  <dd className="rgc-mono text-[11px] text-foreground">{camera.facility}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Battery</dt>
                  <dd className="rgc-mono text-[11px] text-foreground">{camera.battery_pct}%</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Assigned to</dt>
                  <dd className="truncate text-[11px] text-foreground">{employee ? employee.full_name : 'Unassigned'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Paired scanner</dt>
                  <dd className="rgc-mono truncate text-[11px] text-foreground">{scanner ? scanner.device_id : '—'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Mount</dt>
                  <dd className="truncate text-[11px] text-foreground">{camera.mount_position}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Last sync</dt>
                  <dd className="rgc-mono text-[11px] text-foreground">{formatDateTime(camera.last_sync_at)}</dd>
                </div>
              </dl>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-border pt-2">
                {camera.ring_linked ? (
                  <StatusPill tone="info" label="Ring sandbox device" />
                ) : (
                  <StatusPill tone="muted" label="Proposed hardware" />
                )}
                <span className="rgc-mono text-[10px] text-muted-foreground">{camera.firmware}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Panel title="Device provenance" subtitle="What each record represents" >
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <Camera className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Guardian vest cameras</span> are proposed hardware designed
              for this concept. No physical device exists, and no footage in this build was recorded by one.
            </p>
          </li>
          <li className="flex items-start gap-2">
            <Radio className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tone-info" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Ring sandbox device</span> is registered with the Ring
              developer adapter. When real credentials are configured, device discovery and WHEP session requests are
              made against your Ring developer account; in this session the adapter is in simulated mode.
            </p>
          </li>
          <li className="flex items-start gap-2">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Neither type of device is connected to Amazon logistics infrastructure. Nothing here is a recording of a
              real worker or a real customer premises.
            </p>
          </li>
        </ul>
      </Panel>
    </div>
  );
}