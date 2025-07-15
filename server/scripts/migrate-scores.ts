import { eq, or } from "drizzle-orm";
import { db } from "../db";
import { treeNodes } from "@shared/schema";
import { scoreCalculationService } from "../services/score-calculation-service";

export async function migrateExistingScores() {
  console.log('Starting score migration for existing nodes...');
  
  try {
    // Get all nodes that need score calculations
    const allNodes = await db.query.treeNodes.findMany({
      where: or(
        eq(treeNodes.nodeType, 'opportunity'),
        eq(treeNodes.nodeType, 'solution')
      )
    });

    console.log(`Found ${allNodes.length} nodes to process`);

    let updatedCount = 0;
    
    for (const node of allNodes) {
      try {
        const updatedTemplateData = scoreCalculationService.updateNodeScores(node);
        
        // Only update if scores were calculated (check if new score fields exist)
        const hasNewScores = updatedTemplateData.iceScore || updatedTemplateData.riceScore;
        
        if (hasNewScores) {
          await db
            .update(treeNodes)
            .set({
              templateData: updatedTemplateData,
              updatedAt: new Date()
            })
            .where(eq(treeNodes.id, node.id));
          
          updatedCount++;
          console.log(`Updated ${node.nodeType} node ${node.id} with ${node.nodeType === 'opportunity' ? 'ICE' : 'RICE'} score`);
        }
      } catch (error) {
        console.error(`Error updating node ${node.id}:`, error);
      }
    }

    console.log(`Migration completed. Updated ${updatedCount} nodes with calculated scores.`);
    return { success: true, processedNodes: allNodes.length, updatedNodes: updatedCount };
  } catch (error) {
    console.error('Score migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateExistingScores()
    .then(result => {
      console.log('Migration result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}