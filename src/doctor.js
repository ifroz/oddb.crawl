var sql = require('./sql');
var Sequelize = require('sequelize');

var Doctor = sql.define('output', {
  id:               { type: Sequelize.INTEGER, field: 'id' },
  nr:               { type: Sequelize.INTEGER, field: 'nr' },
  contactTypeId:    { type: Sequelize.INTEGER, field: 'contact_type_id' },
  lastName:         { type: Sequelize.STRING, field: 'name_1' },
  firstName:        { type: Sequelize.STRING, field: 'name_2' },
  salutationId:     { type: Sequelize.INTEGER, field: 'salutation_id' },
  titleId:          { type: Sequelize.INTEGER, field: 'title_id' },
  address:          { type: Sequelize.TEXT },
  city:             { type: Sequelize.STRING },
  country:          { type: Sequelize.STRING },
  phone:            { type: Sequelize.STRING, field: 'phone_fixed' },
  mobilePhone:      { type: Sequelize.STRING, field: 'phone_mobile' },
  fax:              { type: Sequelize.STRING },
  url:              { type: Sequelize.STRING },
  skype:            { type: Sequelize.STRING, field: 'skype_name'},
  remarks:          { type: Sequelize.STRING, field: 'remarks' },
  languageId:       { type: Sequelize.INTEGER, field: 'language_id' },
  isLead:           { type: Sequelize.BOOLEAN, field: 'is_lead'},
  contactGroupIds:  { type: Sequelize.STRING, field: 'contact_group_ids' },
  userId:           { type: Sequelize.INTEGER, field: 'user_id' },
  ownerId:          { type: Sequelize.INTEGER, field: 'owner_id' },
  updatedAt:        { type: Sequelize.DATE, field: 'updated_at'},
  localId:          { type: Sequelize.INTEGER, field: 'local_id'},
  status:           { type: Sequelize.STRING },

  email: { type: Sequelize.STRING },
  jsonMatches: { type: Sequelize.TEXT, field: 'json_matches' }
}, {
  tableName: 'oddb.output'
});

module.exports = Doctor;