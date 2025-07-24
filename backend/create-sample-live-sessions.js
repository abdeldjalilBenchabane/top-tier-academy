const pool = require('./db.js');

async function createSampleLiveSessions() {
  try {
    console.log('🚀 Creating sample live sessions...\n');

    // First, let's get a professor user
    const professorResult = await pool.query('SELECT id, name FROM users WHERE role = $1 LIMIT 1', ['professor']);
    
    let professor;
    
    if (professorResult.rows.length === 0) {
      console.log('❌ No professor found. Creating a test professor first...');
      
      // Create a test professor
      const createProfessorResult = await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name',
        ['أستاذ أحمد', 'ahmed@test.com', '$2b$10$test', 'professor']
      );
      
      professor = createProfessorResult.rows[0];
      console.log('✅ Created test professor:', professor.name);
    } else {
      professor = professorResult.rows[0];
      console.log('✅ Found professor:', professor.name);
    }
    
    // Create sample live sessions
    const sessions = [
      {
        title: 'مقدمة في الرياضيات - الجبر',
        description: 'درس تفاعلي في أساسيات الجبر للمرحلة الابتدائية مع أمثلة عملية وتطبيقات',
        start_time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        duration: 60,
        price: 500,
        professor_id: professor.id
      },
      {
        title: 'اللغة العربية - النحو والصرف',
        description: 'شرح مفصل لقواعد النحو والصرف مع أمثلة عملية وتطبيقات في الجمل',
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        duration: 90,
        price: 750,
        professor_id: professor.id
      },
      {
        title: 'العلوم الطبيعية - الكيمياء',
        description: 'تجارب كيميائية ممتعة مع شرح النظريات العلمية والتطبيقات العملية',
        start_time: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
        duration: 120,
        price: 1000,
        professor_id: professor.id
      },
      {
        title: 'الفيزياء - الميكانيكا',
        description: 'شرح قوانين نيوتن والحركة مع تطبيقات عملية وتجارب تفاعلية',
        start_time: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours from now
        duration: 75,
        price: 800,
        professor_id: professor.id
      },
      {
        title: 'التاريخ - الحضارة الإسلامية',
        description: 'رحلة عبر التاريخ الإسلامي مع التركيز على الإنجازات العلمية والثقافية',
        start_time: new Date(Date.now() + 96 * 60 * 60 * 1000), // 96 hours from now
        duration: 60,
        price: 600,
        professor_id: professor.id
      }
    ];
    
    console.log('📝 Creating live sessions...\n');
    
    for (const session of sessions) {
      const result = await pool.query(
        'INSERT INTO live_sessions (professor_id, title, description, start_time, duration, price, is_approved) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [session.professor_id, session.title, session.description, session.start_time, session.duration, session.price, true]
      );
      console.log(`✅ Created: ${result.rows[0].title}`);
      console.log(`   📅 Time: ${new Date(result.rows[0].start_time).toLocaleString('ar-SA')}`);
      console.log(`   ⏱️  Duration: ${result.rows[0].duration} minutes`);
      console.log(`   💰 Price: ${result.rows[0].price} DZD`);
      console.log('');
    }
    
    // Show all live sessions
    const allSessions = await pool.query('SELECT * FROM live_sessions ORDER BY start_time ASC');
    console.log('📋 All Live Sessions in Database:');
    console.log('=====================================');
    allSessions.rows.forEach((session, index) => {
      console.log(`${index + 1}. ${session.title}`);
      console.log(`   👨‍🏫 Professor ID: ${session.professor_id}`);
      console.log(`   📅 Time: ${new Date(session.start_time).toLocaleString('ar-SA')}`);
      console.log(`   ⏱️  Duration: ${session.duration} minutes`);
      console.log(`   💰 Price: ${session.price} DZD`);
      console.log(`   ✅ Status: ${session.is_approved ? 'Approved' : 'Pending'}`);
      console.log(`   📝 Description: ${session.description}`);
      console.log('');
    });
    
    console.log('🎉 Sample live sessions created successfully!');
    console.log('🌐 Now you can visit the live classes page to see the cards in action!');
    
  } catch (error) {
    console.error('❌ Error creating live sessions:', error);
  } finally {
    await pool.end();
  }
}

createSampleLiveSessions(); 