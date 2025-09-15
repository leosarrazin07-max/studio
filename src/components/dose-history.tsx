
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Prise } from "@/lib/types";
import { format } from "date-fns";
import { fr, enUS, de, it, es, ru, uk, ar, tr, da, sv, nl, pt, sr, ro, pl } from "date-fns/locale";
import { History, Pill, PlayCircle, StopCircle, CheckCircle2 } from "lucide-react";
import { useI18n, useCurrentLocale, useScopedI18n } from '@/locales/client';

interface DoseHistoryProps {
  prises: Prise[];
}

const locales: { [key: string]: Locale } = {
  fr, en: enUS, de, it, es, ru, uk, ar, tr, da, sv, nl, pt, sr, ro, pl
};

const EventDetails: React.FC<{ prise: Prise }> = ({ prise }) => {
    const t = useScopedI18n('doseHistory.event');
    const currentLocale = useCurrentLocale();
    const locale = locales[currentLocale] || fr;

    let Icon;
    let title = '';
    let details = `le ${format(new Date(prise.time), "eeee dd MMMM 'à' HH:mm", { locale })}`;

    switch (prise.type) {
        case 'start':
            Icon = PlayCircle;
            title = t('start');
            break;
        case 'dose':
            Icon = CheckCircle2;
            title = t('dose');
            break;
        case 'stop':
            Icon = StopCircle;
            title = t('stop');
            break;
        default:
            Icon = Pill;
            title = t('unknown');
    }

    return (
        <div className="flex items-center gap-4">
            <Icon className="text-primary h-6 w-6" />
            <div className="flex-1">
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{details}</p>
            </div>
            {prise.type !== 'stop' && (
                 <div className="flex items-center gap-1 text-primary font-medium">
                      <span>{prise.pills}</span>
                      <Pill size={16} />
                </div>
            )}
        </div>
    );
};


export function DoseHistory({ prises }: DoseHistoryProps) {
  const t = useScopedI18n('doseHistory');
  const reversedPrises = React.useMemo(() => [...prises].reverse(), [prises]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <History className="text-primary" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-48 w-full pr-4">
          {reversedPrises.length > 0 ? (
            <div className="space-y-4">
              {reversedPrises.map((prise, index) => (
                <div key={prise.id}>
                  <EventDetails prise={prise} />
                  {index < reversedPrises.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-10">
              <p>{t('empty.title')}</p>
              <p className="text-sm">{t('empty.subtitle')}</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
