// Script pour ajouter course_id à la table live_sessions existante
import pool from './db.js';

async function addCourseIdColumn() {
    try {
        console.log('Vérification de la structure de la table live_sessions...');

        // Vérifier si la colonne course_id existe déjà
        const columnExists = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions' 
      AND column_name = 'course_id'
    `);

        if (columnExists.rows.length === 0) {
            console.log('Ajout de la colonne course_id à la table live_sessions...');

            // Ajouter la colonne course_id
            await pool.query(`
        ALTER TABLE live_sessions 
        ADD COLUMN course_id INTEGER REFERENCES courses(id)
      `);

            console.log('✅ Colonne course_id ajoutée avec succès !');
        } else {
            console.log('✅ La colonne course_id existe déjà.');
        }

        // Afficher la structure actuelle de la table
        const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'live_sessions'
      ORDER BY ordinal_position
    `);

        console.log('\n📋 Structure actuelle de la table live_sessions :');
        structure.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout de la colonne :', error);
    } finally {
        await pool.end();
    }
}

addCourseIdColumn(); 