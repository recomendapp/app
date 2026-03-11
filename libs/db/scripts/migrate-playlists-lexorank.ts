import 'dotenv/config'; // 🔥 Doit être la TOUTE PREMIÈRE ligne !
import { db } from '../src/lib/client';
import { LexoRank } from 'lexorank';
import { asc, eq } from 'drizzle-orm';
import { playlistItem } from '../src/lib/schemas';

async function runLexoRankMigration() {
  console.log('🚀 Début de la conversion LexoRank...');
  
  try {
    const playlistsQuery = await db
      .selectDistinct({ playlistId: playlistItem.playlistId })
      .from(playlistItem);

    const playlistIds = playlistsQuery.map(p => p.playlistId);
    console.log(`Trouvé ${playlistIds.length} playlists à traiter.`);

    for (const pid of playlistIds) {
      const items = await db
        .select({ id: playlistItem.id, rank: playlistItem.rank })
        .from(playlistItem)
        .where(eq(playlistItem.playlistId, pid))
        .orderBy(asc(playlistItem.rank));

      let currentLexoRank = LexoRank.middle();

      for (const item of items) {
        await db
          .update(playlistItem)
          .set({ rank: currentLexoRank.toString() })
          .where(eq(playlistItem.id, item.id));

        currentLexoRank = currentLexoRank.genNext();
      }
      
      console.log(`✅ Playlist ${pid} convertie avec succès (${items.length} items).`);
    }

    console.log('🎉 Migration LexoRank totalement terminée !');
    process.exit(0); // 🔥 Ferme le processus proprement (succès)
  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    process.exit(1); // 🔥 Ferme le processus avec une erreur
  }
}

runLexoRankMigration();