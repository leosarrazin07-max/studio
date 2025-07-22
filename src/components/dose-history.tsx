
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Prise } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { History, Pill, PlayCircle, StopCircle, CheckCircle2 } from "lucide-react";

interface DoseHistoryProps {
  prises: Prise[];
}

const EventDetails: React.FC<{ prise: Prise }> = ({ prise }) => {
    let Icon;
    let title = '';
    let details = `le ${format(new Date(prise.time), "eeee dd MMMM 'à' HH:mm", { locale: fr })}`;

    switch (prise.type) {
        case 'start':
            Icon = PlayCircle;
            title = "Démarrage de la session";
            break;
        case 'dose':
            Icon = CheckCircle2;
            title = "Prise de comprimé";
            break;
        case 'stop':
            Icon = StopCircle;
            title = "Fin de session";
            break;
        default:
            Icon = Pill;
            title = "Événement inconnu";
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
  const reversedDoses = [...prises].reverse();

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <History className="text-primary" />
          Journal de bord
        </CardTitle>
        <CardDescription>Vos activités des 90 derniers jours.</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-48 w-full pr-4">
          {reversedDoses.length > 0 ? (
            <div className="space-y-4">
              {reversedDoses.map((prise, index) => (
                <div key={prise.id}>
                  <EventDetails prise={prise} />
                  {index < reversedDoses.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-10">
              <p>Aucune activité enregistrée.</p>
              <p className="text-sm">Démarrez une session pour commencer.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
